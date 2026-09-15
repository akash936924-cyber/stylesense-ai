"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Scissors,
  Trash2,
} from "lucide-react";
import { getSkinTone, SKIN_TONES } from "@/lib/studio/skinTones";
import type { Outfit, OutfitItem, Product } from "@/lib/types";
import { prefsStore, savedStore } from "@/lib/store";
import { Mannequin } from "@/components/studio/mannequin";
import { Button, GlassCard, PageHeader } from "@/components/ui";

const BASE_ITEM_WIDTH = 150; // px at scale 1

function DraggableItem({
  item,
  selected,
  onSelect,
}: {
  item: OutfitItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: item.id });
  const t = item.transform;
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onPointerDown={(e) => {
        onSelect();
        listeners?.onPointerDown?.(e);
      }}
      className={`absolute left-1/2 top-1/2 cursor-grab touch-none active:cursor-grabbing ${
        selected ? "outline-2 outline-dashed outline-ink-faint rounded-lg" : ""
      }`}
      style={{
        width: BASE_ITEM_WIDTH * t.scale,
        zIndex: t.zIndex,
        transform: `translate(-50%, -50%) translate(${t.x + (transform?.x ?? 0)}px, ${
          t.y + (transform?.y ?? 0)
        }px) rotate(${t.rotation}deg)`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.cutoutUrl ?? item.imageUrl}
        alt=""
        draggable={false}
        className="pointer-events-none w-full select-none"
      />
    </div>
  );
}

function StudioContent() {
  const searchParams = useSearchParams();
  const [prefs, setPrefs] = prefsStore.use();
  const [saved, setSaved] = savedStore.use();

  const [items, setItems] = useState<OutfitItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [outfitId, setOutfitId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [cutting, setCutting] = useState<string | null>(null);
  const [cutError, setCutError] = useState<string | null>(null);
  const [demoTray, setDemoTray] = useState<Product[]>([]);
  const loadedOutfitRef = useRef<string | null>(null);

  const tone = getSkinTone(prefs.skinToneId);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  // load an outfit deep-linked from /saved
  const outfitParam = searchParams.get("outfit");
  useEffect(() => {
    if (!outfitParam || loadedOutfitRef.current === outfitParam) return;
    const outfit = saved.outfits.find((o) => o.id === outfitParam);
    if (outfit) {
      loadedOutfitRef.current = outfitParam;
      setOutfitId(outfit.id);
      setName(outfit.name);
      // blob: cutouts don't survive reloads — fall back to the original image
      setItems(
        outfit.items.map((i) => ({
          ...i,
          cutoutUrl: i.cutoutUrl?.startsWith("blob:") ? undefined : i.cutoutUrl,
        })),
      );
      setPrefs((p) => ({ ...p, skinToneId: outfit.skinToneId }));
    }
  }, [outfitParam, saved.outfits, setPrefs]);

  // tray = saved pieces; if none yet, offer demo pieces so the studio works day one
  useEffect(() => {
    if (saved.products.length || demoTray.length) return;
    fetch("/api/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ limit: 12 }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => json?.demo && setDemoTray(json.products))
      .catch(() => {});
  }, [saved.products.length, demoTray.length]);

  const tray = saved.products.length ? saved.products : demoTray;

  const addItem = useCallback((product: Product) => {
    const isTransparent = product.imageUrl.startsWith("data:image/svg");
    setItems((prev) => {
      const id = crypto.randomUUID();
      setSelectedId(id);
      return [
        ...prev,
        {
          id,
          productId: product.id,
          imageUrl: product.imageUrl,
          cutoutUrl: isTransparent ? product.imageUrl : undefined,
          transform: {
            x: ((prev.length % 3) - 1) * 30,
            y: ((prev.length % 4) - 1) * 30,
            scale: 1,
            rotation: 0,
            zIndex: prev.length + 1,
          },
        },
      ];
    });
  }, []);

  const updateSelected = useCallback(
    (fn: (t: OutfitItem["transform"]) => Partial<OutfitItem["transform"]>) => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === selectedId ? { ...i, transform: { ...i.transform, ...fn(i.transform) } } : i,
        ),
      );
    },
    [selectedId],
  );

  const onDragEnd = useCallback((e: DragEndEvent) => {
    const { id } = e.active;
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              transform: {
                ...i.transform,
                x: i.transform.x + e.delta.x,
                y: i.transform.y + e.delta.y,
              },
            }
          : i,
      ),
    );
  }, []);

  async function removeBackgroundOfSelected() {
    const item = items.find((i) => i.id === selectedId);
    if (!item || item.cutoutUrl || cutting) return;
    setCutting(item.id);
    setCutError(null);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(item.imageUrl);
      const url = URL.createObjectURL(blob);
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, cutoutUrl: url } : i)));
    } catch {
      setCutError(
        "Couldn't cut this image out (the store may block cross-site image access) — styling with the full photo instead.",
      );
    } finally {
      setCutting(null);
    }
  }

  function saveOutfit() {
    if (!items.length) return;
    const id = outfitId ?? crypto.randomUUID();
    const outfit: Outfit = {
      id,
      name: name.trim() || `Look ${saved.outfits.length + 1}`,
      skinToneId: tone.id,
      items,
      updatedAt: new Date().toISOString(),
    };
    setSaved((s) => ({
      ...s,
      outfits: [...s.outfits.filter((o) => o.id !== id), outfit],
    }));
    setOutfitId(id);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  }

  const selected = items.find((i) => i.id === selectedId);

  return (
    <div>
      <PageHeader
        title="Studio"
        subtitle="Drag pieces onto the model, layer and resize them, and save looks you love."
      >
        <div className="flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="name this look"
            className="glass w-40 rounded-full px-4 py-2 text-sm outline-none placeholder:text-ink-faint"
          />
          <Button onClick={saveOutfit} disabled={!items.length}>
            <span className="flex items-center gap-1.5">
              {justSaved ? <Check size={15} /> : null}
              {justSaved ? "Saved" : "Save look"}
            </span>
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-wrap gap-6">
        {/* canvas */}
        <div className="min-w-80 flex-1">
          <GlassCard className="relative mx-auto h-[72vh] max-w-xl overflow-hidden">
            <DndContext sensors={sensors} onDragEnd={onDragEnd}>
              <div
                className="relative h-full w-full"
                onPointerDown={(e) => {
                  if (e.target === e.currentTarget) setSelectedId(null);
                }}
              >
                <Mannequin
                  tone={tone}
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[96%] -translate-x-1/2 -translate-y-1/2"
                />
                {items.map((item) => (
                  <DraggableItem
                    key={item.id}
                    item={item}
                    selected={item.id === selectedId}
                    onSelect={() => setSelectedId(item.id)}
                  />
                ))}
              </div>
            </DndContext>

            {/* selected-item toolbar */}
            {selected && (
              <div className="glass-strong absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full px-2 py-1">
                <ToolButton label="Smaller" onClick={() => updateSelected((t) => ({ scale: Math.max(0.3, t.scale / 1.12) }))}>
                  <Minus size={14} />
                </ToolButton>
                <ToolButton label="Bigger" onClick={() => updateSelected((t) => ({ scale: Math.min(3.5, t.scale * 1.12) }))}>
                  <Plus size={14} />
                </ToolButton>
                <ToolButton label="Rotate left" onClick={() => updateSelected((t) => ({ rotation: t.rotation - 10 }))}>
                  <RotateCcw size={14} />
                </ToolButton>
                <ToolButton label="Rotate right" onClick={() => updateSelected((t) => ({ rotation: t.rotation + 10 }))}>
                  <RotateCw size={14} />
                </ToolButton>
                <ToolButton label="Layer up" onClick={() => updateSelected((t) => ({ zIndex: t.zIndex + 1 }))}>
                  <ArrowUp size={14} />
                </ToolButton>
                <ToolButton label="Layer down" onClick={() => updateSelected((t) => ({ zIndex: Math.max(1, t.zIndex - 1) }))}>
                  <ArrowDown size={14} />
                </ToolButton>
                {!selected.cutoutUrl && (
                  <ToolButton label="Remove background" onClick={removeBackgroundOfSelected}>
                    <Scissors size={14} className={cutting ? "animate-pulse" : ""} />
                  </ToolButton>
                )}
                <ToolButton
                  label="Remove piece"
                  onClick={() => {
                    setItems((prev) => prev.filter((i) => i.id !== selectedId));
                    setSelectedId(null);
                  }}
                >
                  <Trash2 size={14} />
                </ToolButton>
              </div>
            )}
          </GlassCard>
          {cutError && <p className="mt-2 text-xs text-ink-muted">{cutError}</p>}
        </div>

        {/* right rail: tones + tray */}
        <div className="flex w-72 shrink-0 flex-col gap-6 max-lg:w-full">
          <GlassCard className="p-4">
            <p className="mb-3 text-xs uppercase tracking-widest text-ink-muted">Skin tone</p>
            <div className="flex flex-wrap gap-2">
              {SKIN_TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-label={t.name}
                  title={t.name}
                  onClick={() => setPrefs((p) => ({ ...p, skinToneId: t.id }))}
                  className={`h-9 w-9 rounded-full border-2 transition ${
                    t.id === tone.id ? "border-ink scale-110" : "border-edge"
                  }`}
                  style={{ backgroundColor: t.base }}
                />
              ))}
            </div>
          </GlassCard>

          <GlassCard className="min-h-0 flex-1 p-4">
            <p className="mb-1 text-xs uppercase tracking-widest text-ink-muted">Pieces</p>
            <p className="mb-3 text-xs text-ink-faint">
              {saved.products.length
                ? "your saved pieces — click to place"
                : "demo pieces — save real ones from Shop"}
            </p>
            {tray.length ? (
              <div className="grid max-h-[52vh] grid-cols-3 gap-2 overflow-y-auto">
                {tray.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addItem(p)}
                    title={p.title}
                    className="glass aspect-square overflow-hidden rounded-xl p-1.5 transition hover:bg-surface-hover"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="h-full w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-muted">
                No pieces yet —{" "}
                <Link href="/shop" className="underline">
                  find some on Shop
                </Link>
                .
              </p>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="rounded-full p-2 text-ink-muted transition hover:bg-surface-hover hover:text-ink"
    >
      {children}
    </button>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={null}>
      <StudioContent />
    </Suspense>
  );
}
