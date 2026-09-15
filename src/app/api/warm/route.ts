import { NextResponse } from "next/server";
import { warmModels } from "@/lib/similarity/embed";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Keepalive endpoint for a Vercel cron: pre-loads the CLIP pipelines so
 * inspo matching doesn't pay the cold-start, and (once Supabase is wired)
 * pings the DB to prevent the free-tier idle pause.
 */
export async function GET() {
  await warmModels();
  return NextResponse.json({ ok: true, warmed: ["clip-feature", "clip-zeroshot"] });
}
