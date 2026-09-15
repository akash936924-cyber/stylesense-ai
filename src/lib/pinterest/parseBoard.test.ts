import { describe, expect, it } from "vitest";
import {
  extractBoardPath,
  parseBoardPidgetsResponse,
  pidgetsBoardUrl,
} from "./parseBoard";

describe("extractBoardPath", () => {
  it("reads user/board from board URLs across hosts", () => {
    expect(extractBoardPath("https://www.pinterest.com/etsy/etsy-fashion/")).toEqual({
      user: "etsy",
      board: "etsy-fashion",
    });
    expect(extractBoardPath("https://pinterest.co.uk/Jane_Doe/Fall-Looks")).toEqual({
      user: "jane_doe",
      board: "fall-looks",
    });
  });

  it("rejects pins, profiles, site sections, and non-Pinterest hosts", () => {
    expect(extractBoardPath("https://www.pinterest.com/pin/123/")).toBeNull();
    expect(extractBoardPath("https://www.pinterest.com/etsy/")).toBeNull();
    expect(extractBoardPath("https://www.pinterest.com/etsy/etsy-fashion/section/")).toBeNull();
    expect(extractBoardPath("https://www.pinterest.com/search/pins/")).toBeNull();
    expect(extractBoardPath("https://www.pinterest.com/user/_created/")).toBeNull();
    expect(extractBoardPath("https://pin.it/abc123")).toBeNull();
    expect(extractBoardPath("https://evil.com/user/board/")).toBeNull();
    expect(extractBoardPath("not a url")).toBeNull();
  });
});

describe("pidgetsBoardUrl", () => {
  it("builds the widget endpoint url", () => {
    expect(pidgetsBoardUrl({ user: "etsy", board: "etsy-fashion" })).toBe(
      "https://widgets.pinterest.com/v3/pidgets/boards/etsy/etsy-fashion/pins/",
    );
  });
});

describe("parseBoardPidgetsResponse", () => {
  // shape captured live from the endpoint on 2026-07-18
  const live = {
    status: "success",
    data: {
      user: { full_name: "Etsy" },
      board: { name: "Etsy Fashion", pin_count: 952, follower_count: 1 },
      pins: [
        {
          id: "155303888285878378",
          description: "  Hand-woven shoulder bag.  ",
          dominant_color: "#8b6f5c",
          is_video: false,
          images: {
            "236x": { url: "https://i.pinimg.com/236x/97/68/0c/aa.jpg", width: 236, height: 314 },
            "564x": { url: "https://i.pinimg.com/564x/97/68/0c/aa.jpg", width: 564, height: 751 },
          },
        },
        {
          id: "2",
          description: null,
          images: {
            "236x": { url: "https://i.pinimg.com/236x/bb.jpg", width: 236 },
          },
        },
        { id: "no-image" },
        {
          id: "off-cdn",
          images: { "236x": { url: "https://evil.com/x.jpg", width: 236 } },
        },
      ],
    },
  };

  it("keeps CDN-hosted pins with the largest bucket upsized", () => {
    const parsed = parseBoardPidgetsResponse(live);
    expect(parsed?.board).toEqual({ name: "Etsy Fashion", pinCount: 952 });
    expect(parsed?.pins).toEqual([
      {
        id: "155303888285878378",
        imageUrl: "https://i.pinimg.com/736x/97/68/0c/aa.jpg",
        description: "Hand-woven shoulder bag.",
      },
      { id: "2", imageUrl: "https://i.pinimg.com/736x/bb.jpg", description: undefined },
    ]);
  });

  it("returns null on junk and empty boards", () => {
    expect(parseBoardPidgetsResponse(null)).toBeNull();
    // the endpoint's own 404 shape: data is an empty array
    expect(parseBoardPidgetsResponse({ status: "failure", data: [] })).toBeNull();
    expect(parseBoardPidgetsResponse({ data: { pins: [] } })).toBeNull();
  });
});
