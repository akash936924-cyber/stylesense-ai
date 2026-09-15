"use client";

import { Bookmark, ExternalLink } from "lucide-react";
import type { Product } from "@/lib/types";
import { savedStore } from "@/lib/store";

function priceLabel(p: Product): string {
  if (p.price.amount === 0) return "See price";
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: p.price.currency }).format(n);
  return fmt(p.salePrice ?? p.price.amount);
}

export function ProductCard({ product }: { product: Product }) {
  const [saved, setSaved] = savedStore.use();
  const isSaved = saved.products.some((p) => p.id === product.id);

  const toggleSave = () =>
    setSaved((s) => ({
      ...s,
      products: isSaved
        ? s.products.filter((p) => p.id !== product.id)
        : [...s.products, product],
    }));

  return (
    <div className="glass group flex flex-col overflow-hidden rounded-2xl transition hover:bg-surface-hover">
      <div className="relative aspect-[3/4] overflow-hidden bg-white/40 dark:bg-white/5">
        {product.imageUrl ? (
          // arbitrary retailer hosts — plain img, no next/image domain allowlist
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-ink-faint">
            no image
          </div>
        )}
        <button
          type="button"
          aria-label={isSaved ? "Remove from saved" : "Save item"}
          onClick={toggleSave}
          className={`glass-strong absolute right-2 top-2 rounded-full p-2 transition ${
            isSaved ? "text-like" : "text-ink-muted opacity-0 group-hover:opacity-100"
          }`}
        >
          <Bookmark size={15} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-3">
        <p className="truncate text-sm" title={product.title}>
          {product.title}
        </p>
        <p className="truncate text-xs text-ink-muted">
          {[...new Set([product.brand, product.retailer.name].filter(Boolean))].join(" · ")}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-medium">
            {priceLabel(product)}
            {product.salePrice && (
              <span className="ml-1.5 text-xs text-ink-faint line-through">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: product.price.currency,
                }).format(product.price.amount)}
              </span>
            )}
          </span>
          {product.productUrl !== "#demo" && (
            <a
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Buy at ${product.retailer.name}`}
              className="rounded-full p-1.5 text-ink-faint transition hover:bg-surface-hover hover:text-ink"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
