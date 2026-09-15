import { NextResponse } from "next/server";
import { RETAILER_CATALOG } from "@/lib/retailers";

export function GET() {
  return NextResponse.json({
    retailers: RETAILER_CATALOG,
    // catalog retailers are reached through these APIs; without a key the
    // picker should say so instead of silently returning nothing
    catalogConfigured: !!(
      process.env.CHANNEL3_API_KEY ||
      (process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET)
    ),
  });
}
