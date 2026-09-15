import { describe, expect, it } from "vitest";
import { hexToCanonical, searchTermsFor, wordToCanonical } from "./canonical";

describe("hexToCanonical", () => {
  it("classifies obvious colors", () => {
    expect(hexToCanonical("#000000")).toBe("black");
    expect(hexToCanonical("#ffffff")).toBe("white");
    expect(hexToCanonical("#d32f2f")).toBe("red");
    expect(hexToCanonical("#1a2744")).toBe("navy");
  });

  it("lands fashion neutrals in the right bucket", () => {
    expect(hexToCanonical("#b8ad9e")).toBe("beige"); // taupe
    expect(hexToCanonical("#c19a6b")).toBe("beige"); // camel
    expect(hexToCanonical("#f5f1ea")).toBe("cream"); // ivory
    expect(hexToCanonical("#4e342e")).toBe("brown"); // espresso
  });

  it("separates burgundy from red and navy from blue", () => {
    expect(hexToCanonical("#6d071a")).toBe("burgundy");
    expect(hexToCanonical("#800020")).toBe("burgundy");
    expect(hexToCanonical("#4a90d9")).toBe("blue");
  });

  it("falls back to grey on unparseable input", () => {
    expect(hexToCanonical("not-a-color")).toBe("grey");
  });
});

describe("searchTermsFor", () => {
  it("returns retailer-friendly words", () => {
    expect(searchTermsFor("#c19a6b")).toContain("camel");
    expect(searchTermsFor("#6d071a")).toContain("wine");
  });
});

describe("wordToCanonical", () => {
  it("maps product color words back to canonical buckets", () => {
    expect(wordToCanonical("Camel")).toBe("beige");
    expect(wordToCanonical("ivory")).toBe("cream");
    expect(wordToCanonical("Navy")).toBe("navy");
    expect(wordToCanonical("chartreuse")).toBeUndefined();
  });
});
