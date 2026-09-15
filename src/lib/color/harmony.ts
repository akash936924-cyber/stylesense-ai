import { converter, formatHex } from "culori";
import type { Harmony, Palette, PaletteColor } from "@/lib/types";
import { hexToCanonical, SEARCH_TERMS } from "./canonical";

/**
 * Color-theory harmonies tuned for clothing: rotations happen in OKHSL
 * (perceptually even), and companion colors are desaturated and pulled
 * toward wearable lightness instead of raw color-wheel neon.
 */
const toOkhsl = converter("okhsl");
const WEARABLE_SATURATION = 0.62; // cap: fabrics are rarely full-chroma

type Okhsl = { mode: "okhsl"; h?: number; s: number; l: number };

function shifted(base: Okhsl, hueDelta: number, s: number, l: number): string {
  const c: Okhsl = {
    mode: "okhsl",
    h: ((base.h ?? 0) + hueDelta + 360) % 360,
    s: Math.min(s, WEARABLE_SATURATION),
    l: Math.min(0.92, Math.max(0.12, l)),
  };
  return formatHex(c);
}

function toPaletteColor(hex: string, name: string): PaletteColor {
  const canonical = hexToCanonical(hex);
  return { hex, name, canonical, searchTerms: SEARCH_TERMS[canonical] };
}

function describe(hex: string): string {
  const okhsl = toOkhsl(hex);
  const canonical = hexToCanonical(hex);
  if (!okhsl) return canonical;
  if (okhsl.l >= 0.75) return `light ${canonical}`;
  if (okhsl.l <= 0.3) return `deep ${canonical}`;
  return canonical;
}

/** Generate the classic harmonies from one seed color. */
export function generateHarmonies(seedHex: string): Palette[] {
  const base = toOkhsl(seedHex);
  if (!base) return [];
  const b: Okhsl = { mode: "okhsl", h: base.h ?? 0, s: base.s, l: base.l };

  const recipes: { harmony: Harmony; name: string; hexes: string[] }[] = [
    {
      harmony: "monochrome",
      name: "Tonal",
      hexes: [
        shifted(b, 0, b.s * 0.5, 0.85),
        shifted(b, 0, b.s * 0.8, 0.62),
        formatHex({ ...b }),
        shifted(b, 0, b.s * 0.9, 0.25),
      ],
    },
    {
      harmony: "analogous",
      name: "Neighbors",
      hexes: [
        shifted(b, -30, b.s * 0.75, b.l + 0.12),
        formatHex({ ...b }),
        shifted(b, 30, b.s * 0.75, b.l - 0.08),
        shifted(b, 0, b.s * 0.25, 0.88), // neutral to ground the look
      ],
    },
    {
      harmony: "complementary",
      name: "Contrast",
      hexes: [
        formatHex({ ...b }),
        shifted(b, 180, b.s * 0.55, b.l),
        shifted(b, 0, b.s * 0.2, 0.87),
        shifted(b, 180, b.s * 0.35, 0.28),
      ],
    },
    {
      harmony: "split-complementary",
      name: "Soft contrast",
      hexes: [
        formatHex({ ...b }),
        shifted(b, 150, b.s * 0.5, b.l + 0.08),
        shifted(b, 210, b.s * 0.5, b.l - 0.05),
        shifted(b, 0, b.s * 0.18, 0.9),
      ],
    },
    {
      harmony: "triadic",
      name: "Trio",
      hexes: [
        formatHex({ ...b }),
        shifted(b, 120, b.s * 0.45, b.l),
        shifted(b, 240, b.s * 0.45, Math.max(0.3, b.l - 0.1)),
        shifted(b, 0, b.s * 0.15, 0.88),
      ],
    },
  ];

  return recipes.map(({ harmony, name, hexes }) => ({
    id: `gen-${harmony}-${seedHex.replace("#", "")}`,
    name,
    kind: "harmony" as const,
    harmony,
    colors: hexes.map((hex) => toPaletteColor(hex, describe(hex))),
  }));
}

export { toPaletteColor };
