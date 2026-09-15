import { NextResponse } from "next/server";
import { z } from "zod";
import {
  extractBoardPath,
  parseBoardPidgetsResponse,
  pidgetsBoardUrl,
} from "@/lib/pinterest/parseBoard";
import { isAllowedPinHost, isShortPinUrl } from "@/lib/pinterest/parsePin";
import { followWithinPinterest } from "@/lib/pinterest/resolve";

export const runtime = "nodejs";
export const maxDuration = 30;

const boardBody = z.object({
  boardUrl: z.url().max(500),
});

/** List a public board's recent pins (~50) via the no-key pidgets endpoint. */
export async function POST(req: Request) {
  const parsed = boardBody.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  let url = parsed.data.boardUrl;
  if (!isAllowedPinHost(url)) {
    return NextResponse.json({ error: "That isn't a Pinterest URL." }, { status: 422 });
  }
  if (isShortPinUrl(url)) {
    try {
      const resolved = await followWithinPinterest(url);
      if (!resolved) {
        return NextResponse.json({ error: "Couldn't resolve that link." }, { status: 422 });
      }
      url = resolved;
    } catch {
      return NextResponse.json({ error: "Couldn't resolve that link." }, { status: 422 });
    }
  }

  const ref = extractBoardPath(url);
  if (!ref) {
    return NextResponse.json(
      { error: "That doesn't look like a board URL — boards look like pinterest.com/username/board-name." },
      { status: 422 },
    );
  }

  let json: unknown;
  try {
    const res = await fetch(pidgetsBoardUrl(ref));
    json = res.ok ? await res.json() : null;
  } catch {
    json = null;
  }
  const found = json ? parseBoardPidgetsResponse(json) : null;
  if (!found) {
    return NextResponse.json(
      { error: "Couldn't read that board — secret boards can't be fetched, only public ones." },
      { status: 422 },
    );
  }

  // flat shape: { user, board (slug), name, pinCount, pins }
  return NextResponse.json({ ...ref, ...found.board, pins: found.pins });
}
