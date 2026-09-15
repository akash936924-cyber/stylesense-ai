"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import { CURATED_PALETTES } from "@/lib/color/palettes";
import { generateHarmonies } from "@/lib/color/harmony";
import type { Palette } from "@/lib/types";
import { PaletteCard } from "@/components/palette-card";
import { GlassCard, PageHeader } from "@/components/ui";

export default function PalettesPage() {
  const [seed, setSeed] = useState("#c19a6b");
  const [generated, setGenerated] = useState<Palette[]>([]);

  const editorial = CURATED_PALETTES.filter((p) => p.kind === "editorial");
  const seasonal = CURATED_PALETTES.filter((p) => p.kind === "seasonal");

  return (
    <div>
      <PageHeader
        title="Palettes"
        subtitle="Color combinations that work on a body, not just a mood board. Like the ones that feel like you, then shop them."
      />

      <GlassCard className="mb-10 flex flex-wrap items-center gap-4 p-4">
        <div className="flex items-center gap-3">
          <Wand2 size={17} className="text-ink-muted" />
          <span className="text-sm">Build around a color you love</span>
        </div>
        <input
          type="color"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          aria-label="Seed color"
          className="h-9 w-14 cursor-pointer rounded-lg border border-edge bg-transparent"
        />
        <button
          type="button"
          onClick={() => setGenerated(generateHarmonies(seed))}
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90"
        >
          Generate harmonies
        </button>
      </GlassCard>

      {generated.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display mb-4 text-2xl">From your color</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {generated.map((p) => (
              <PaletteCard key={p.id} palette={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mb-10">
        <h2 className="font-display mb-4 text-2xl">Editorial combinations</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {editorial.map((p) => (
            <PaletteCard key={p.id} palette={p} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display mb-4 text-2xl">By season</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {seasonal.map((p) => (
            <PaletteCard key={p.id} palette={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
