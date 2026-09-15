import { describe, expect, it } from "vitest";
import {
  extractPinId,
  isAllowedPinHost,
  isAllowedPinImageUrl,
  isShortPinUrl,
  parseOgImage,
  parsePidgetsResponse,
  pidgetsUrl,
} from "./parsePin";

describe("extractPinId", () => {
  it("reads ids from pinterest pin URLs across TLDs", () => {
    expect(extractPinId("https://www.pinterest.com/pin/123456789/")).toBe("123456789");
    expect(extractPinId("https://pinterest.co.uk/pin/42/")).toBe("42");
    expect(extractPinId("https://www.pinterest.com/user/board/")).toBeNull();
    expect(extractPinId("https://example.com/pin/99/")).toBeNull();
  });
});

describe("isShortPinUrl", () => {
  it("detects pin.it short links only", () => {
    expect(isShortPinUrl("https://pin.it/abc123")).toBe(true);
    expect(isShortPinUrl("https://www.pinterest.com/pin/1/")).toBe(false);
  });
});

describe("pidgets", () => {
  it("builds the widget endpoint url", () => {
    expect(pidgetsUrl("77")).toBe(
      "https://widgets.pinterest.com/v3/pidgets/pins/info/?pin_ids=77",
    );
  });

  it("picks the largest image and upsizes the CDN bucket", () => {
    const url = parsePidgetsResponse({
      data: [
        {
          images: {
            "237x": { url: "https://i.pinimg.com/237x/aa/bb.jpg", width: 237 },
            "136x136": { url: "https://i.pinimg.com/136x136/aa/bb.jpg", width: 136 },
          },
        },
      ],
    });
    expect(url).toBe("https://i.pinimg.com/736x/aa/bb.jpg");
  });

  it("returns null on junk", () => {
    expect(parsePidgetsResponse({ data: [] })).toBeNull();
    expect(parsePidgetsResponse(null)).toBeNull();
    expect(parsePidgetsResponse({ data: [{ images: {} }] })).toBeNull();
  });
});

describe("isAllowedPinHost (SSRF guard)", () => {
  it("allows Pinterest hosts and regional TLDs", () => {
    expect(isAllowedPinHost("https://pin.it/abc")).toBe(true);
    expect(isAllowedPinHost("https://www.pinterest.com/pin/1/")).toBe(true);
    expect(isAllowedPinHost("https://uk.pinterest.com/pin/1/")).toBe(true);
    expect(isAllowedPinHost("https://pinterest.co.uk/pin/1/")).toBe(true);
    expect(isAllowedPinHost("https://pinterest.fr/pin/1/")).toBe(true);
  });

  it("rejects everything else, including lookalikes and internal targets", () => {
    expect(isAllowedPinHost("https://evil.com/pin/1/")).toBe(false);
    expect(isAllowedPinHost("https://pinterest.com.evil.com/pin/1/")).toBe(false);
    expect(isAllowedPinHost("https://notpinterest.com/pin/1/")).toBe(false);
    expect(isAllowedPinHost("http://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isAllowedPinHost("http://localhost:3100/api/warm")).toBe(false);
    expect(isAllowedPinHost("file:///etc/passwd")).toBe(false);
    expect(isAllowedPinHost("not a url")).toBe(false);
  });
});

describe("isAllowedPinImageUrl (SSRF guard)", () => {
  it("allows only https pinimg.com images", () => {
    expect(isAllowedPinImageUrl("https://i.pinimg.com/736x/aa/bb.jpg")).toBe(true);
    expect(isAllowedPinImageUrl("http://i.pinimg.com/736x/aa/bb.jpg")).toBe(false);
    expect(isAllowedPinImageUrl("https://evil.com/i.pinimg.com/x.jpg")).toBe(false);
    expect(isAllowedPinImageUrl("https://internal.service/img.jpg")).toBe(false);
  });
});

describe("parseOgImage", () => {
  it("finds og:image in either attribute order", () => {
    expect(
      parseOgImage(`<meta property="og:image" content="https://x.com/i.jpg" />`),
    ).toBe("https://x.com/i.jpg");
    expect(
      parseOgImage(`<meta content="https://x.com/j.jpg" property="og:image"/>`),
    ).toBe("https://x.com/j.jpg");
    expect(parseOgImage("<html></html>")).toBeNull();
  });
});
