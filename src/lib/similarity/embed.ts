import { pipeline, RawImage } from "@huggingface/transformers";
import type { CanonicalColor } from "@/lib/types";
import { rgbToCanonical } from "@/lib/color/canonical";

/**
 * Server-side CLIP (quantized ~90MB, downloaded to ./.cache on first use).
 * Module-scope singletons keep the model warm across requests; /api/warm
 * pre-loads it on deploys.
 */
const MODEL = "Xenova/clip-vit-base-patch32";

type FeatureExtractor = Awaited<ReturnType<typeof pipeline<"image-feature-extraction">>>;
type ZeroShot = Awaited<ReturnType<typeof pipeline<"zero-shot-image-classification">>>;

let featureExtractor: Promise<FeatureExtractor> | null = null;
let zeroShot: Promise<ZeroShot> | null = null;

// memoize the load, but drop a rejected promise so a transient download
// failure doesn't poison every future request
function getFeatureExtractor() {
  featureExtractor ??= (
    pipeline("image-feature-extraction", MODEL, { dtype: "q8" }) as Promise<FeatureExtractor>
  ).catch((err) => {
    featureExtractor = null;
    throw err;
  });
  return featureExtractor;
}

function getZeroShot() {
  zeroShot ??= (
    pipeline("zero-shot-image-classification", MODEL, { dtype: "q8" }) as Promise<ZeroShot>
  ).catch((err) => {
    zeroShot = null;
    throw err;
  });
  return zeroShot;
}

/** Warm both pipelines (called by /api/warm cron). */
export async function warmModels(): Promise<void> {
  await Promise.all([getFeatureExtractor(), getZeroShot()]);
}

/**
 * Load any image reference into a RawImage. RawImage.read() handles http(s)
 * URLs and file paths but not base64 data URLs in Node — decode those
 * ourselves.
 */
export async function loadImage(input: string): Promise<RawImage> {
  if (input.startsWith("data:")) {
    const base64 = input.slice(input.indexOf(",") + 1);
    return RawImage.fromBlob(new Blob([Buffer.from(base64, "base64")]));
  }
  return RawImage.read(input);
}

/** 512-dim CLIP image embedding. Accepts http(s)/data: URLs or file paths. */
export async function embedImage(input: string | RawImage): Promise<number[]> {
  const image = typeof input === "string" ? await loadImage(input) : input;
  const extract = await getFeatureExtractor();
  const output = await extract(image);
  return Array.from(output.data as Float32Array);
}

export const GARMENT_LABELS = [
  "dress",
  "sweater",
  "blazer",
  "coat",
  "jacket",
  "jeans",
  "trousers",
  "skirt",
  "top",
  "blouse",
  "cardigan",
  "boots",
  "heels",
  "sneakers",
  "handbag",
  "full outfit",
] as const;

/** Zero-shot garment classification — what is this a picture of? */
export async function classifyGarment(
  input: string | RawImage,
): Promise<{ label: string; score: number }[]> {
  const image = typeof input === "string" ? await loadImage(input) : input;
  const classify = await getZeroShot();
  const result = (await classify(image, [...GARMENT_LABELS])) as {
    label: string;
    score: number;
  }[];
  return result.sort((a, b) => b.score - a.score);
}

export interface DominantColor {
  canonical: CanonicalColor;
  /** mean shade of the bucket's pixels — feeds hex-palette search filters */
  hex: string;
}

/**
 * Dominant colors of an image, with a border heuristic: the majority
 * bucket along the edges is treated as background and excluded (unless
 * nothing else remains).
 */
export async function dominantColors(
  input: string | RawImage,
  k = 3,
): Promise<DominantColor[]> {
  const source = typeof input === "string" ? await loadImage(input) : input;
  const image = await source.resize(48, 48);
  const rgb = image.rgb();
  const { data, width, height } = rgb;

  type Acc = { n: number; r: number; g: number; b: number };
  const counts = new Map<CanonicalColor, Acc>();
  const borderCounts = new Map<CanonicalColor, number>();
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 3;
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      const bucket = rgbToCanonical(r, g, b);
      const acc = counts.get(bucket) ?? { n: 0, r: 0, g: 0, b: 0 };
      acc.n += 1;
      acc.r += r;
      acc.g += g;
      acc.b += b;
      counts.set(bucket, acc);
      if (x < 4 || x >= width - 4 || y < 4 || y >= height - 4) {
        borderCounts.set(bucket, (borderCounts.get(bucket) ?? 0) + 1);
      }
    }
  }

  const toHex = (acc: Acc) =>
    "#" +
    [acc.r, acc.g, acc.b]
      .map((v) => Math.round(v / acc.n).toString(16).padStart(2, "0"))
      .join("");

  const borderTotal = [...borderCounts.values()].reduce((a, b) => a + b, 0);
  const background = [...borderCounts.entries()].find(
    ([, n]) => n / Math.max(1, borderTotal) > 0.5,
  )?.[0];

  const ranked = [...counts.entries()]
    .filter(([bucket]) => bucket !== background)
    .sort((a, b) => b[1].n - a[1].n)
    .map(([canonical, acc]) => ({ canonical, hex: toHex(acc) }));

  return (
    ranked.length
      ? ranked
      : [{ canonical: background!, hex: toHex(counts.get(background!)!) }]
  ).slice(0, k);
}
