import { describe, expect, it } from "vitest";
import { isSafeRemoteImageUrl } from "./safe-url";

describe("isSafeRemoteImageUrl (SSRF guard)", () => {
  it("allows plain https hosts", () => {
    expect(isSafeRemoteImageUrl("https://i.pinimg.com/736x/a.jpg")).toBe(true);
    expect(isSafeRemoteImageUrl("https://images.retailer.com/p/1.jpg?w=400")).toBe(true);
  });

  it("blocks internal and non-https targets", () => {
    expect(isSafeRemoteImageUrl("http://images.retailer.com/p.jpg")).toBe(false);
    expect(isSafeRemoteImageUrl("https://localhost/x.jpg")).toBe(false);
    expect(isSafeRemoteImageUrl("https://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isSafeRemoteImageUrl("https://10.0.0.5/x.jpg")).toBe(false);
    expect(isSafeRemoteImageUrl("https://[::1]/x.jpg")).toBe(false);
    expect(isSafeRemoteImageUrl("https://vault.internal/x.jpg")).toBe(false);
    expect(isSafeRemoteImageUrl("https://printer.local/x.jpg")).toBe(false);
    expect(isSafeRemoteImageUrl("https://host.com:8443/x.jpg")).toBe(false);
    expect(isSafeRemoteImageUrl("https://user:pass@host.com/x.jpg")).toBe(false);
    expect(isSafeRemoteImageUrl("file:///etc/passwd")).toBe(false);
    expect(isSafeRemoteImageUrl("not a url")).toBe(false);
  });
});
