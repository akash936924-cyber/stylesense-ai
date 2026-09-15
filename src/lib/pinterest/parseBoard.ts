import { z } from "zod";
import { isAllowedPinHost, isAllowedPinImageUrl, upsizePinImage } from "./parsePin";

/**
 * Resolve a pasted Pinterest board URL to its recent pins — no API key
 * needed, same unofficial pidgets widget family as single pins. The
 * endpoint returns the ~50 most recent pins of a public board.
 */

export interface BoardRef {
  user: string;
  board: string;
}

export interface BoardPin {
  id: string;
  imageUrl: string;
  description?: string;
}

export interface BoardSummary {
  name: string;
  /** total pins on the board — the endpoint only serves the recent ~50 */
  pinCount: number;
}

// site sections and profile sub-pages that share the /segment/segment/ shape
const RESERVED_USERS = new Set([
  "pin", "search", "ideas", "today", "videos", "settings", "business",
  "news", "about", "explore", "resource", "shopping", "gift-guides",
  "email", "oauth", "login", "signup", "topics", "categories", "policy",
]);
const RESERVED_BOARDS = new Set([
  "pins", "boards", "_created", "_saved", "following", "followers",
  "about", "activity",
]);

/** Board URLs look like pinterest.com/<user>/<board>/ — two path segments. */
export function extractBoardPath(url: string): BoardRef | null {
  if (!isAllowedPinHost(url)) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  // pin.it short links must be redirect-resolved (I/O) before this check
  if (parsed.hostname.toLowerCase().replace(/\.$/, "") === "pin.it") return null;
  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length !== 2) return null;
  let user: string;
  let board: string;
  try {
    [user, board] = segments.map((s) => decodeURIComponent(s).toLowerCase());
  } catch {
    return null;
  }
  if (RESERVED_USERS.has(user) || RESERVED_BOARDS.has(board)) return null;
  if (!/^[\w.-]{1,100}$/.test(user) || !/^[\w-]{1,100}$/.test(board)) return null;
  return { user, board };
}

export function pidgetsBoardUrl(ref: BoardRef): string {
  return `https://widgets.pinterest.com/v3/pidgets/boards/${encodeURIComponent(
    ref.user,
  )}/${encodeURIComponent(ref.board)}/pins/`;
}

const boardResponse = z.looseObject({
  data: z.looseObject({
    board: z
      .looseObject({
        name: z.string().optional(),
        pin_count: z.number().optional(),
      })
      .optional(),
    pins: z
      .array(
        z.looseObject({
          id: z.string(),
          description: z.string().nullish(),
          images: z
            .record(
              z.string(),
              z.looseObject({ url: z.string(), width: z.number().optional() }),
            )
            .optional(),
        }),
      )
      .optional(),
  }),
});

/** Pins with a usable CDN image, largest bucket upsized — null when empty/junk. */
export function parseBoardPidgetsResponse(
  json: unknown,
): { board: BoardSummary; pins: BoardPin[] } | null {
  const parsed = boardResponse.safeParse(json);
  if (!parsed.success) return null;
  const { board, pins = [] } = parsed.data.data;
  const cleaned = pins.flatMap((p): BoardPin[] => {
    const best = Object.values(p.images ?? {}).sort(
      (a, b) => (b.width ?? 0) - (a.width ?? 0),
    )[0];
    if (!best) return [];
    const imageUrl = upsizePinImage(best.url);
    if (!isAllowedPinImageUrl(imageUrl)) return [];
    const description = p.description?.trim();
    return [{ id: p.id, imageUrl, description: description || undefined }];
  });
  if (!cleaned.length) return null;
  return {
    board: {
      name: board?.name ?? "Pinterest board",
      pinCount: board?.pin_count ?? cleaned.length,
    },
    pins: cleaned,
  };
}
