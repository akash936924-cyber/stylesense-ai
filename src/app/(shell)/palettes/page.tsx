"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Wand2, Sparkles, ArrowRight, Palette as PaletteIcon } from "lucide-react";

import { CURATED_PALETTES } from "@/lib/color/palettes";
import { generateHarmonies } from "@/lib/color/harmony";
import type { Palette } from "@/lib/types";
import { PaletteCard } from "@/components/palette-card";
import { GlassCard } from "@/components/ui";

export default function PalettesPage() {
  const [seed, setSeed] = useState("#c19a6b");
  const [generated, setGenerated] = useState<Palette[]>([]);

  const editorial = CURATED_PALETTES.filter((p) => p.kind === "editorial");
  const seasonal = CURATED_PALETTES.filter((p) => p.kind === "seasonal");

  // Mouse interaction for 3D tilt effect on Hero
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 100, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 100, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  // Parallax offsets for floating items
  const modelX = useTransform(mouseXSpring, [-0.5, 0.5], [-18, 18]);
  const modelY = useTransform(mouseYSpring, [-0.5, 0.5], [-18, 18]);
  const coatX = useTransform(mouseXSpring, [-0.5, 0.5], [-28, 28]);
  const coatY = useTransform(mouseYSpring, [-0.5, 0.5], [-28, 28]);
  const jacketX = useTransform(mouseXSpring, [-0.5, 0.5], [24, -24]);
  const jacketY = useTransform(mouseYSpring, [-0.5, 0.5], [24, -24]);
  const shoesX = useTransform(mouseXSpring, [-0.5, 0.5], [-20, 20]);
  const shoesY = useTransform(mouseYSpring, [-0.5, 0.5], [-20, 20]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="space-y-12">
      {/* ================= APPLE VISION PRO / AWWWARDS HERO ================= */}
      <motion.section 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative overflow-hidden rounded-[40px] border border-white/20 bg-slate-950 p-6 md:p-12 text-white shadow-[0_30px_120px_rgba(0,0,0,0.7)] backdrop-blur-3xl"
      >
        {/* Animated Background Mesh & Aurora Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/80 to-black pointer-events-none" />
        
        {/* Moving Aurora Blobs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.25, 1],
            x: [0, 50, -50, 0],
            y: [0, -35, 35, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-20 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-fuchsia-600/35 via-pink-500/20 to-transparent blur-[130px] pointer-events-none" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, -60, 60, 0],
            y: [0, 45, -45, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -left-20 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-cyan-500/30 via-blue-600/20 to-transparent blur-[130px] pointer-events-none" 
        />

        {/* Thin Luxury Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* 25 Glowing Cyan/Pink Particles */}
        {[...Array(25)].map((_, i) => {
          const isCyan = i % 2 === 0;
          return (
            <motion.div
              key={i}
              animate={{
                y: [0, -40, 0],
                x: [0, (i % 3 === 0 ? 15 : -15), 0],
                opacity: [0.2, 0.9, 0.2],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: 3 + (i % 5) * 1.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: (i * 0.2) % 3
              }}
              className={`absolute h-1.5 w-1.5 rounded-full blur-[0.5px] pointer-events-none ${
                isCyan ? "bg-cyan-400 shadow-[0_0_12px_#22d3ee]" : "bg-pink-400 shadow-[0_0_12px_#ec4899]"
              }`}
              style={{
                top: `${(i * 7) % 90 + 5}%`,
                left: `${(i * 9) % 95 + 2}%`,
              }}
            />
          );
        })}

        <div className="relative z-10 grid items-center gap-12 lg:grid-cols-2">

          {/* LEFT SIDE */}
          <div className="flex flex-col items-start">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
            >
              <Sparkles className="h-4 w-4 text-pink-400 animate-pulse" />
              <span className="text-xs font-semibold tracking-wider uppercase bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                AI Fashion Discovery Platform
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]"
            >
              Find Your Perfect Outfit with{" "}
              <span className="bg-gradient-to-r from-pink-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-sm">
                StyleSense AI
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-base sm:text-lg leading-relaxed text-zinc-300 max-w-xl font-light"
            >
              Upload inspiration images, generate harmonious color palettes,
              discover visually similar outfits across multiple fashion stores,
              and build premium looks with AI intelligence.
            </motion.p>

            {/* Premium Interactive Buttons with Shimmer CTA */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-4 w-full sm:w-auto"
            >
              <motion.button 
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.04 }}
                className="group relative overflow-hidden rounded-2xl bg-white px-8 py-4 font-semibold text-black shadow-[0_0_35px_rgba(255,255,255,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="relative z-10 flex items-center gap-2">
                  ✨ Try AI Search <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/90 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </motion.button>

              <motion.button 
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.04, backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                className="rounded-2xl border border-white/25 bg-white/10 px-8 py-4 font-semibold backdrop-blur-xl transition-all shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex items-center justify-center gap-2 cursor-pointer hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
              >
                <PaletteIcon className="h-4 w-4 text-cyan-300" /> Explore Palettes
              </motion.button>
            </motion.div>

            {/* Animated Stats Cards with Hover Lift */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full"
            >
              {[
                ["50+", "Fashion Stores"],
                ["10K+", "Outfit Matches"],
                ["98%", "Color Accuracy"],
                ["24/7", "AI Styling"],
              ].map(([value, label], idx) => (
                <motion.div
                  key={label}
                  whileHover={{ scale: 1.06, y: -6 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-2xl shadow-lg transition-all hover:border-white/40 hover:bg-white/[0.12] hover:shadow-[0_15px_35px_rgba(255,255,255,0.15)] cursor-pointer"
                >
                  <p className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">{value}</p>
                  <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-medium">{label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT SIDE: Apple Vision Pro 3D Compositions */}
          <div className="relative h-[580px] hidden lg:block w-full">

            {/* Soft Glass Spotlight Container */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[460px] w-[460px] rounded-full border border-white/15 bg-gradient-to-b from-white/[0.1] to-transparent backdrop-blur-3xl shadow-[0_0_120px_rgba(0,0,0,0.85)] pointer-events-none" />

            {/* Rotating Neon Rings Behind Model */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[380px] w-[380px] rounded-full border border-dashed border-fuchsia-500/40 shadow-[0_0_20px_rgba(219,39,119,0.2)] pointer-events-none"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[340px] w-[340px] rounded-full border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.2)] pointer-events-none blur-sm"
            />

            {/* Glowing Floor Shadow Under Model */}
            <div className="absolute left-1/2 bottom-10 -translate-x-1/2 h-20 w-64 rounded-full bg-gradient-to-r from-fuchsia-500/50 via-cyan-400/40 to-purple-600/50 blur-2xl pointer-events-none" />

            {/* Floating Animated Model with Parallax */}
            <motion.div
              style={{ x: modelX, y: modelY }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
              animate={{ y: [0, -16, 0], rotate: [0, 2, -2, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.07 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent rounded-3xl opacity-60" />
                <Image
                  src="/models/pashan.png"
                  alt="Fashion Model"
                  width={300}
                  height={430}
                  priority
                  className="drop-shadow-[0_35px_80px_rgba(0,0,0,0.8)] object-contain select-none"
                />
              </div>
            </motion.div>

            {/* Independently Floating Coat Card */}
            <motion.div
              style={{ x: coatX, y: coatY }}
              className="absolute left-4 top-8 cursor-pointer z-30"
              initial={{ rotate: -12 }}
              animate={{ y: [0, -14, 0], rotate: [-12, -7, -12] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.14, rotate: 0 }}
            >
              <div className="rounded-[28px] border border-white/25 bg-white/[0.09] p-3.5 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] hover:border-white/50 hover:shadow-[0_0_30px_rgba(219,39,119,0.3)] transition-all">
                <Image
                  src="/models/coaat.png"
                  alt="Coat"
                  width={140}
                  height={180}
                  className="rounded-2xl object-contain drop-shadow-md select-none"
                />
              </div>
            </motion.div>

            {/* Independently Floating Jacket Card */}
            <motion.div
              style={{ x: jacketX, y: jacketY }}
              className="absolute right-2 top-16 cursor-pointer z-30"
              initial={{ rotate: 10 }}
              animate={{ y: [0, -12, 0], rotate: [10, 5, 10] }}
              transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              whileHover={{ scale: 1.14, rotate: 0 }}
            >
              <div className="rounded-[28px] border border-white/25 bg-white/[0.09] p-3.5 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] hover:border-white/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-all">
                <Image
                  src="/models/back.png"
                  alt="Jacket"
                  width={140}
                  height={180}
                  className="rounded-2xl object-contain drop-shadow-md select-none"
                />
              </div>
            </motion.div>

            {/* Independently Floating Shoes Card */}
            <motion.div
              style={{ x: shoesX, y: shoesY }}
              className="absolute bottom-4 left-16 cursor-pointer z-30"
              initial={{ rotate: 6 }}
              animate={{ y: [0, -10, 0], rotate: [6, 1, 6] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              whileHover={{ scale: 1.14, rotate: 0 }}
            >
              <div className="rounded-[28px] border border-white/25 bg-white/[0.09] p-3.5 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] hover:border-white/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all">
                <Image
                  src="/models/white.png"
                  alt="Shoes"
                  width={130}
                  height={130}
                  className="rounded-2xl object-contain drop-shadow-md select-none"
                />
              </div>
            </motion.div>

            {/* Ambient Corner Neons */}
            <div className="absolute bottom-6 right-12 h-28 w-28 rounded-full bg-cyan-400/35 blur-[45px] pointer-events-none" />
            <div className="absolute top-12 left-1/3 h-24 w-24 rounded-full bg-pink-500/35 blur-[40px] pointer-events-none" />

          </div>
        </div>
      </motion.section>

      {/* Color Generator */}
      <GlassCard className="mb-10 flex flex-wrap items-center gap-4 p-5 backdrop-blur-2xl border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <Wand2 size={18} className="text-ink-muted" />
          <span className="text-sm font-medium">Build around a color you love</span>
        </div>

        <input
          type="color"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-xl border border-edge bg-transparent transition hover:scale-105"
        />

        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          onClick={() => setGenerated(generateHarmonies(seed))}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-fg transition shadow-md hover:shadow-lg cursor-pointer"
        >
          Generate Harmonies
        </motion.button>
      </GlassCard>

      {/* Generated */}
      {generated.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold tracking-tight">From Your Color</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {generated.map((p) => (
              <PaletteCard key={p.id} palette={p} />
            ))}
          </div>
        </section>
      )}

      {/* Editorial */}
      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold tracking-tight">Editorial Collections</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {editorial.map((p) => (
            <PaletteCard key={p.id} palette={p} />
          ))}
        </div>
      </section>

      {/* Seasonal */}
      <section>
        <h2 className="mb-4 text-2xl font-bold tracking-tight">Seasonal Collections</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {seasonal.map((p) => (
            <PaletteCard key={p.id} palette={p} />
          ))}
        </div>
      </section>
    </div>
  );
}