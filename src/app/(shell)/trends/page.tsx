"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Newspaper, ShoppingBag } from "lucide-react";
import { getPalette } from "@/lib/color/palettes";
import type { Season, TrendEntry } from "@/lib/types";
import type { RssHeadline } from "@/lib/trends/rss";
import { GlassCard, PageHeader } from "@/components/ui";

interface TrendsResponse {
  season: Season;
  year: number;
  trends: TrendEntry[];
  headlines: RssHeadline[];
}

function TrendCard({ trend }: { trend: TrendEntry }) {
  const palette = trend.paletteId ? getPalette(trend.paletteId) : undefined;
  return (
    <GlassCard className="flex flex-col p-5">
      {palette && (
        <div className="mb-4 flex h-10 gap-1 overflow-hidden rounded-lg">
          {palette.colors.map((c) => (
            <div key={c.hex} className="flex-1" style={{ backgroundColor: c.hex }} />
          ))}
        </div>
      )}
      <h3 className="font-display text-xl leading-snug">{trend.title}</h3>
      <p className="mt-2 flex-1 text-sm text-ink-muted">{trend.blurb}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/shop?q=${encodeURIComponent(trend.searchTerms[0])}${
            trend.paletteId ? `&palette=${trend.paletteId}` : ""
          }`}
          className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-accent-fg transition hover:opacity-90"
        >
          <ShoppingBag size={13} /> shop the trend
        </Link>
        {palette && (
          <Link
            href={`/shop?palette=${palette.id}`}
            className="glass flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs transition hover:bg-surface-hover"
          >
            shop the palette
          </Link>
        )}
      </div>
    </GlassCard>
  );
}

export default function TrendsPage() {
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/trends")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  return (
    <div>
      <PageHeader
        title="Trends"
        subtitle={
          data
            ? `What's moving in ${data.season} ${data.year} — every trend links straight to shoppable pieces.`
            : "What's moving this season."
        }
      />

      {failed && (
        <GlassCard className="p-6 text-sm text-ink-muted">
          Couldn't load trends right now — try refreshing.
        </GlassCard>
      )}

      {!data && !failed && <p className="text-sm text-ink-muted">Loading trends…</p>}

      {data && (
        <>
          <section className="mb-12">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.trends.map((t) => (
                <TrendCard key={t.id} trend={t} />
              ))}
            </div>
          </section>

          {data.headlines.length > 0 && (
            <section>
              <h2 className="font-display mb-4 flex items-center gap-2 text-2xl">
                <Newspaper size={20} className="text-ink-muted" />
                From the magazines
              </h2>
              <div className="flex flex-col gap-2">
                {data.headlines.map((h) => (
                  <a
                    key={h.link}
                    href={h.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass group flex items-center justify-between gap-4 rounded-2xl px-5 py-3.5 text-sm transition hover:bg-surface-hover"
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{h.title}</span>
                      <span className="text-xs text-ink-faint">{h.source}</span>
                    </span>
                    <ArrowUpRight
                      size={15}
                      className="shrink-0 text-ink-faint transition group-hover:text-ink"
                    />
                  </a>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
