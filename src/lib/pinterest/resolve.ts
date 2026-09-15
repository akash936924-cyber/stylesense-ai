import {
  extractPinId,
  isAllowedPinHost,
  isAllowedPinImageUrl,
  isShortPinUrl,
  parseOgImage,
  parsePidgetsResponse,
  pidgetsUrl,
} from "./parsePin";
import { extractBoardPath } from "./parseBoard";

/**
 * Server-side resolution of pasted Pinterest URLs (the I/O half; parsing
 * stays in parsePin/parseBoard). Every fetch target is host-checked first.
 */

/** Follow redirects manually, rejecting any hop that leaves Pinterest (SSRF guard). */
export async function followWithinPinterest(
  url: string,
  maxHops = 5,
): Promise<string | null> {
  let current = url;
  for (let hop = 0; hop < maxHops; hop++) {
    if (!isAllowedPinHost(current)) return null;
    const res = await fetch(current, { redirect: "manual" });
    const location = res.headers.get("location");
    if (res.status < 300 || res.status >= 400 || !location) return current;
    current = new URL(location, current).toString();
  }
  return null;
}

export type PinResolution =
  | { kind: "image"; url: string }
  /** the pasted link (often pin.it) turned out to be a whole board */
  | { kind: "board"; boardUrl: string }
  | { kind: "none" };

/**
 * Pasted URL → pin image on Pinterest's CDN.
 * Primary: the public pidgets widget endpoint. Fallback: og:image scrape.
 */
export async function resolvePinSource(pinUrl: string): Promise<PinResolution> {
  // user-supplied URL: only ever fetch Pinterest hosts, on every hop
  if (!isAllowedPinHost(pinUrl)) return { kind: "none" };
  let url = pinUrl;
  if (isShortPinUrl(url)) {
    try {
      const resolved = await followWithinPinterest(url);
      if (!resolved) return { kind: "none" };
      url = resolved;
    } catch {
      return { kind: "none" };
    }
  }
  if (extractBoardPath(url)) return { kind: "board", boardUrl: url };
  const pinId = extractPinId(url);
  if (pinId) {
    try {
      const res = await fetch(pidgetsUrl(pinId));
      if (res.ok) {
        const image = parsePidgetsResponse(await res.json());
        if (image && isAllowedPinImageUrl(image)) return { kind: "image", url: image };
      }
    } catch {
      // unofficial endpoint — fall through to og:image
    }
  }
  if (!isAllowedPinHost(url)) return { kind: "none" };
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; closet-labs)" },
    });
    if (res.ok) {
      const image = parseOgImage(await res.text());
      // only trust images on Pinterest's CDN before we fetch their bytes
      if (image && isAllowedPinImageUrl(image)) return { kind: "image", url: image };
    }
  } catch {
    // unreachable page
  }
  return { kind: "none" };
}
