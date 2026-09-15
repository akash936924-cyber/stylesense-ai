import { z } from "zod";

/**
 * Resolve a pasted Pinterest pin URL to its image — no API key needed.
 * Primary: the public pidgets widget endpoint. Fallback: og:image scrape.
 * pin.it short links are resolved to full URLs by the route (I/O) first.
 */
export function extractPinId(url: string): string | null {
  const match = url.match(/pinterest\.[a-z.]+\/pin\/(\d+)/i);
  return match ? match[1] : null;
}

export function isShortPinUrl(url: string): boolean {
  return /(^|\/\/)pin\.it\//i.test(url);
}

/**
 * SSRF guard: user-pasted pin URLs may only point at Pinterest itself.
 * Allows pin.it, pinterest.com (+subdomains), and regional pinterest TLDs
 * (pinterest.fr, pinterest.co.uk, ...). Re-check every redirect hop too.
 */
export function isAllowedPinHost(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
  return (
    host === "pin.it" ||
    host === "pinterest.com" ||
    host.endsWith(".pinterest.com") ||
    /^(www\.)?pinterest\.[a-z]{2,3}(\.[a-z]{2})?$/.test(host)
  );
}

/** The resolved inspo image must be https on Pinterest's image CDN. */
export function isAllowedPinImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
    return parsed.protocol === "https:" && (host === "pinimg.com" || host.endsWith(".pinimg.com"));
  } catch {
    return false;
  }
}

export function pidgetsUrl(pinId: string): string {
  return `https://widgets.pinterest.com/v3/pidgets/pins/info/?pin_ids=${pinId}`;
}

/** /236x/ etc. are size buckets in the CDN path — /736x/ is the big one. */
export function upsizePinImage(url: string): string {
  return url.replace(/\/\d+x\d*\//, "/736x/");
}

const pidgetsResponse = z.looseObject({
  data: z
    .array(
      z.looseObject({
        images: z
          .record(
            z.string(),
            z.looseObject({ url: z.string(), width: z.number().optional() }),
          )
          .optional(),
      }),
    )
    .optional(),
});

/** Pick the largest available image, upsizing Pinterest's CDN path when possible. */
export function parsePidgetsResponse(json: unknown): string | null {
  const parsed = pidgetsResponse.safeParse(json);
  if (!parsed.success) return null;
  const images = parsed.data.data?.[0]?.images;
  if (!images) return null;
  const best = Object.values(images).sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];
  if (!best) return null;
  return upsizePinImage(best.url);
}

export function parseOgImage(html: string): string | null {
  const match =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  return match ? match[1] : null;
}
