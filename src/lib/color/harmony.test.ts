import { describe, expect, it } from "vitest";
import { generateHarmonies } from "./harmony";

describe("generateHarmonies", () => {
  const palettes = generateHarmonies("#c19a6b"); // camel seed

  it("produces the five classic harmonies", () => {
    expect(palettes.map((p) => p.harmony)).toEqual([
      "monochrome",
      "analogous",
      "complementary",
      "split-complementary",
      "triadic",
    ]);
  });

  it("gives every color a valid hex, canonical bucket and search terms", () => {
    for (const palette of palettes) {
      expect(palette.colors.length).toBeGreaterThanOrEqual(4);
      for (const color of palette.colors) {
        expect(color.hex).toMatch(/^#[0-9a-f]{6}$/);
        expect(color.canonical).toBeTruthy();
        expect(color.searchTerms.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps saturation wearable (no full-chroma neon)", () => {
    // triadic companions of a saturated seed stay capped
    const triadic = generateHarmonies("#ff0000").find((p) => p.harmony === "triadic")!;
    for (const color of triadic.colors) {
      expect(color.hex).not.toBe("#00ff00");
      expect(color.hex).not.toBe("#0000ff");
    }
  });

  it("returns empty for invalid seeds", () => {
    expect(generateHarmonies("nope")).toEqual([]);
  });
});
