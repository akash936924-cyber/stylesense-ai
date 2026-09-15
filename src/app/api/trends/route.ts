import { NextResponse } from "next/server";
import { currentSeason, trendsForSeason } from "@/lib/trends/curated";
import { parseRssHeadlines, type RssHeadline } from "@/lib/trends/rss";

export const runtime = "nodejs";
export const revalidate = 86400; // refresh the RSS strip daily

const FEEDS = [
  { url: "https://www.vogue.com/feed/rss", source: "Vogue" },
  { url: "https://www.whowhatwear.com/feeds.xml", source: "Who What Wear" },
  { url: "https://www.harpersbazaar.com/rss/fashion.xml/", source: "Harper's Bazaar" },
];

export async function GET() {
  const { season, year } = currentSeason();

  const results = await Promise.allSettled(
    FEEDS.map(async ({ url, source }) => {
      // no-store: WhoWhatWear's feed exceeds the 2MB per-item fetch-cache cap;
      // the route's own daily revalidate handles caching for all feeds
      const res = await fetch(url, {
        headers: { "user-agent": "closet-labs (personal styling app)" },
        cache: "no-store",
      });
      if (!res.ok) return [] as RssHeadline[];
      return parseRssHeadlines(await res.text(), source, 6);
    }),
  );

  // interleave sources so one magazine doesn't dominate the strip
  const perFeed = results.map((r) => (r.status === "fulfilled" ? r.value : []));
  const headlines: RssHeadline[] = [];
  for (let i = 0; headlines.length < 12; i++) {
    const row = perFeed.map((f) => f[i]).filter(Boolean);
    if (!row.length) break;
    headlines.push(...row);
  }

  return NextResponse.json({
    season,
    year,
    trends: trendsForSeason(season, year),
    headlines: headlines.slice(0, 12),
  });
}
