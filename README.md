# Closet Labs

Find clothes that are actually for sale, driven by **color palettes that go together** and **your inspo images** — filtered by the stores you choose and your budget, with a styling studio to pair pieces on a model.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests (vitest)
```

Works out of the box with **labeled demo data** — no keys needed. Add free API keys (below) to search real stores.

## What's inside

| Section | What it does |
|---|---|
| **Palettes** | Curated editorial + seasonal color combos, plus "generate harmonies from any color". Like a palette → shop it. |
| **Shop** | Product grid from all configured sources, filtered by palette colors, price range, and your chosen stores. |
| **Inspo** | Paste a Pinterest pin URL or drop any outfit image. CLIP reads the garment + colors, searches your stores, and re-ranks results by visual similarity. No Pinterest API key needed. |
| **Trends** | Curated seasonal trends (each links to a palette + shoppable search) + a daily strip of fashion-magazine headlines. |
| **Studio** | Drag pieces onto an illustrated model (7 skin tones), resize/rotate/layer, one-click background removal, save looks. |
| **Saved** | Liked palettes, bookmarked pieces, saved outfits. |
| **Settings** | Pick stores by tier (fast fashion → luxury → marketplaces), add **any custom store by domain**, set your budget. |

## Free API signups (in priority order)

Everything below has a $0 tier. Register early — some approvals take days–weeks.

1. **Channel3** — <https://trychannel3.com> — primary fashion product search, affiliate links that pay you. Self-serve, no card. → `CHANNEL3_API_KEY`
2. **eBay developer program** — <https://developer.ebay.com> — near-instant keys, covers resale/marketplace. → `EBAY_CLIENT_ID` + `EBAY_CLIENT_SECRET`
3. **Tavily** — <https://tavily.com> — lets custom non-Shopify stores be searched (1,000 credits/mo free). → `TAVILY_API_KEY`
4. **Rakuten Advertising publisher** — <https://developers.rakutenadvertising.com> — where Nordstrom-tier retailers live. Apply now; per-advertiser approval takes days–weeks. (Adapter lands with approvals.)
5. **Supabase** — <https://supabase.com> — free Postgres + pgvector for the multi-user phase. Apply `supabase/migrations/0001_init.sql`.
6. **Etsy Open API** — <https://developers.etsy.com> — optional marketplace source (personal app, quick).
7. **Pinterest developers** — <https://developers.pinterest.com> — *only* needed later for full board sync (trial access ≈1–2 days). Pasting pin links works today with no key.

Copy `.env.example` → `.env.local` and fill in what you have.

## Notes

- **First inspo match is slow (~30s)**: the quantized CLIP model (~90MB) downloads to `./.cache` on first use, then it's fast. `GET /api/warm` pre-loads it (point a Vercel cron at it).
- **Custom stores**: Shopify-backed sites (most indie fashion brands) get full catalog search via their public `products.json`; anything else falls back to Tavily site search.
- **Demo data**: with no product API keys, Shop/Inspo show deterministic sample garments and say so in the UI.
- **Deploying**: Vercel Hobby works for personal use (raise `maxDuration` if inspo matching times out). Going public with affiliate revenue requires Vercel Pro (non-commercial clause).

## Architecture (bottom-up)

```
src/lib/types.ts                 domain models (Palette, Product, Outfit, ...)
src/lib/color/                   harmony math + hex→canonical color mapping
src/lib/sources/                 ProductSource adapters (channel3, ebay, shopify,
                                 tavily, sample) — pure builders/parsers + fan-out
src/lib/pinterest/parsePin.ts    pin URL → image (pidgets + og:image, no API)
src/lib/similarity/              CLIP embeddings, zero-shot labels, cosine top-K
src/lib/trends/                  curated seasonal trends + RSS parsing
src/app/api/                     search, inspo, retailers, custom-stores, trends, warm
src/app/(shell)/                 the seven glass UI pages
supabase/migrations/             pgvector schema for the multi-user phase
```
