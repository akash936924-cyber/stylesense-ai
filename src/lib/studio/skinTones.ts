/**
 * Inclusive skin-tone set for the studio mannequin. The SVG reads these as
 * CSS variables, so switching tone is an instant repaint — no image swaps.
 */
export interface SkinTone {
  id: string;
  name: string;
  base: string;
  shadow: string;
}

export const SKIN_TONES: SkinTone[] = [
  { id: "tone-1", name: "Porcelain", base: "#f6e3d4", shadow: "#e8ccb8" },
  { id: "tone-2", name: "Fair", base: "#f0d0b0", shadow: "#dfba97" },
  { id: "tone-3", name: "Golden", base: "#d9a97e", shadow: "#c69364" },
  { id: "tone-4", name: "Tan", base: "#b97f57", shadow: "#a26a45" },
  { id: "tone-5", name: "Bronze", base: "#8f5a3c", shadow: "#78482e" },
  { id: "tone-6", name: "Deep", base: "#6b4130", shadow: "#553225" },
  { id: "tone-7", name: "Ebony", base: "#4a2c21", shadow: "#382018" },
];

export function getSkinTone(id: string): SkinTone {
  return SKIN_TONES.find((t) => t.id === id) ?? SKIN_TONES[2];
}
