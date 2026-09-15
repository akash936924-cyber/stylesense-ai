"use client";

import { useEffect, useState } from "react";
import { KeyRound, Plus, Store, Trash2 } from "lucide-react";
import { RETAILER_CATALOG, TIER_LABELS } from "@/lib/retailers";
import type { Retailer } from "@/lib/types";
import { prefsStore } from "@/lib/store";
import { Button, Chip, GlassCard, PageHeader } from "@/components/ui";

const TIERS: Retailer["tier"][] = ["fast-fashion", "mid", "luxury", "marketplace"];

export default function SettingsPage() {
  const [prefs, setPrefs] = prefsStore.use();
  const [domain, setDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [catalogConfigured, setCatalogConfigured] = useState(true);

  useEffect(() => {
    fetch("/api/retailers")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => json && setCatalogConfigured(json.catalogConfigured))
      .catch(() => {});
  }, []);

  const toggleRetailer = (id: string) =>
    setPrefs((p) => ({
      ...p,
      selectedRetailerIds: p.selectedRetailerIds.includes(id)
        ? p.selectedRetailerIds.filter((r) => r !== id)
        : [...p.selectedRetailerIds, id],
    }));

  async function addStore() {
    if (!domain.trim() || adding) return;
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch("/api/custom-stores", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAddError(json.error ?? "Couldn't add that store");
        return;
      }
      if (prefs.customStores.some((s) => s.domain === json.domain)) {
        setAddError("Store already added");
        return;
      }
      if (!json.searchable) {
        setAddError(
          "This site isn't a Shopify store — add a TAVILY_API_KEY to search generic sites.",
        );
        return;
      }
      const displayName = json.domain.split(".")[0];
      setPrefs((p) => ({
        ...p,
        customStores: [
          ...p.customStores,
          {
            id: json.domain,
            domain: json.domain,
            displayName: displayName.charAt(0).toUpperCase() + displayName.slice(1),
            kind: json.kind,
          },
        ],
      }));
      setDomain("");
    } catch {
      setAddError("Couldn't reach that domain");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Choose which stores to search and set your budget. No stores selected means search everywhere."
      />

      <section className="mb-10">
        <h2 className="font-display mb-4 text-2xl">Stores</h2>
        {!catalogConfigured && (
          <GlassCard className="mb-4 flex items-center gap-3 p-4 text-sm text-ink-muted">
            <KeyRound size={16} className="shrink-0" />
            <span>
              These stores activate once a free <strong>Channel3 or eBay API key</strong>{" "}
              is in <code>.env.local</code> (README has the signup list). Until then,
              only the custom stores you add below are searched.
            </span>
          </GlassCard>
        )}
        <div className="flex flex-col gap-4">
          {TIERS.map((tier) => (
            <GlassCard key={tier} className="p-4">
              <p className="mb-3 text-xs uppercase tracking-widest text-ink-muted">
                {TIER_LABELS[tier]}
              </p>
              <div className="flex flex-wrap gap-2">
                {RETAILER_CATALOG.filter((r) => r.tier === tier).map((r) => (
                  <Chip
                    key={r.id}
                    selected={prefs.selectedRetailerIds.includes(r.id)}
                    onClick={() => toggleRetailer(r.id)}
                  >
                    {r.name}
                  </Chip>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display mb-4 text-2xl">Your stores</h2>
        <GlassCard className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="glass flex min-w-64 flex-1 items-center gap-2 rounded-full px-4 py-2">
              <Store size={15} className="shrink-0 text-ink-faint" />
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addStore()}
                placeholder="add any store, e.g. brandymelville.com"
                className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
              />
            </label>
            <Button onClick={addStore} disabled={adding}>
              <span className="flex items-center gap-1.5">
                <Plus size={15} /> {adding ? "Checking…" : "Add store"}
              </span>
            </Button>
          </div>
          {addError && <p className="mt-3 text-sm text-like">{addError}</p>}
          {prefs.customStores.length > 0 && (
            <ul className="mt-4 flex flex-col gap-2">
              {prefs.customStores.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-edge px-4 py-2.5 text-sm"
                >
                  <span>
                    {s.displayName}
                    <span className="ml-2 text-xs text-ink-faint">
                      {s.domain} · {s.kind === "shopify" ? "full catalog" : "web search"}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${s.displayName}`}
                    onClick={() =>
                      setPrefs((p) => ({
                        ...p,
                        customStores: p.customStores.filter((c) => c.id !== s.id),
                      }))
                    }
                    className="rounded-full p-1.5 text-ink-faint transition hover:text-like"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </section>

      <section>
        <h2 className="font-display mb-4 text-2xl">Budget</h2>
        <GlassCard className="flex items-center gap-3 p-4 text-sm">
          <span>$</span>
          <input
            type="number"
            min={0}
            value={prefs.priceRange.min}
            onChange={(e) =>
              setPrefs((p) => ({
                ...p,
                priceRange: { ...p.priceRange, min: Number(e.target.value) },
              }))
            }
            className="glass w-24 rounded-full px-3 py-1.5 outline-none"
            aria-label="Minimum price"
          />
          <span>to $</span>
          <input
            type="number"
            min={0}
            value={prefs.priceRange.max}
            onChange={(e) =>
              setPrefs((p) => ({
                ...p,
                priceRange: { ...p.priceRange, max: Number(e.target.value) },
              }))
            }
            className="glass w-24 rounded-full px-3 py-1.5 outline-none"
            aria-label="Maximum price"
          />
          <span className="text-ink-muted">per piece</span>
        </GlassCard>
      </section>
    </div>
  );
}
