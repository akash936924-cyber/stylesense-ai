"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { CURATED_PALETTES } from "@/lib/color/palettes";
import { prefsStore, savedStore } from "@/lib/store";
import { PaletteCard } from "@/components/palette-card";
import { ProductCard } from "@/components/product-card";
import { GlassCard, PageHeader } from "@/components/ui";

export default function SavedPage() {
  const [prefs] = prefsStore.use();
  const [saved, setSaved] = savedStore.use();
  const likedPalettes = CURATED_PALETTES.filter((p) =>
    prefs.likedPaletteIds.includes(p.id),
  );

  const empty =
    !likedPalettes.length && !saved.products.length && !saved.outfits.length;

  return (
    <div>
      <PageHeader
        title="Saved"
        subtitle="Your liked palettes, bookmarked pieces, and styled outfits."
      />

      {empty && (
        <GlassCard className="p-8 text-sm text-ink-muted">
          Nothing saved yet — like a palette on{" "}
          <Link href="/palettes" className="underline">
            Palettes
          </Link>{" "}
          or bookmark pieces on{" "}
          <Link href="/shop" className="underline">
            Shop
          </Link>
          .
        </GlassCard>
      )}

      {likedPalettes.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display mb-4 text-2xl">Palettes</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {likedPalettes.map((p) => (
              <PaletteCard key={p.id} palette={p} />
            ))}
          </div>
        </section>
      )}

      {saved.products.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display mb-4 text-2xl">Pieces</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {saved.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {saved.outfits.length > 0 && (
        <section>
          <h2 className="font-display mb-4 text-2xl">Outfits</h2>
          <div className="flex flex-col gap-2">
            {saved.outfits.map((o) => (
              <GlassCard
                key={o.id}
                className="flex items-center justify-between p-4 text-sm"
              >
                <Link href={`/studio?outfit=${o.id}`} className="hover:underline">
                  {o.name}
                  <span className="ml-2 text-xs text-ink-faint">
                    {o.items.length} pieces
                  </span>
                </Link>
                <button
                  type="button"
                  aria-label={`Delete ${o.name}`}
                  onClick={() =>
                    setSaved((s) => ({
                      ...s,
                      outfits: s.outfits.filter((x) => x.id !== o.id),
                    }))
                  }
                  className="rounded-full p-1.5 text-ink-faint transition hover:text-like"
                >
                  <Trash2 size={15} />
                </button>
              </GlassCard>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
