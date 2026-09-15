import type { Outfit } from "@/lib/types";
import type { SkinTone } from "@/lib/studio/skinTones";

/**
 * Try-on seam. The studio's SVG mannequin implements this today; a paid AI
 * try-on provider (e.g. FASHN) drops in later behind the same interface,
 * without touching studio UI or the Outfit model.
 */
export interface TryOnProvider {
  id: string;
  /** render an outfit on a model; returns an image URL (or null = render live in DOM) */
  renderOutfit(outfit: Outfit, tone: SkinTone): Promise<string | null>;
}

export const svgMannequinProvider: TryOnProvider = {
  id: "svg-mannequin",
  // the collage renders live in the DOM — nothing to generate
  async renderOutfit() {
    return null;
  },
};
