import type { CSSProperties } from "react";
import type { SkinTone } from "@/lib/studio/skinTones";

/**
 * Flat-illustration fashion croquis (front pose, ~9 heads tall). Skin reads
 * CSS variables so tone switches are an instant repaint. Deliberately
 * minimal features — the clothes are the point.
 */
export function Mannequin({ tone, className = "" }: { tone: SkinTone; className?: string }) {
  const style = {
    "--skin-base": tone.base,
    "--skin-shadow": tone.shadow,
  } as CSSProperties;

  return (
    <svg
      viewBox="0 0 300 720"
      className={className}
      style={style}
      role="img"
      aria-label={`Model with ${tone.name} skin tone`}
    >
      {/* hair: low bun + crown rim */}
      <circle cx="150" cy="30" r="13" fill="#3b2f27" />
      <ellipse cx="150" cy="54" rx="28" ry="28" fill="#3b2f27" />

      {/* head */}
      <ellipse cx="150" cy="62" rx="25" ry="30" fill="var(--skin-base)" />

      {/* neck shadow cast by the jaw */}
      <path d="M 140 86 Q 150 96 160 86 L 160 100 Q 150 106 140 100 Z" fill="var(--skin-shadow)" />

      {/* left arm */}
      <path
        d="M 92 128
           C 84 150, 80 182, 79 214
           C 77 248, 72 285, 69 318
           C 66 332, 64 344, 68 353
           C 73 346, 76 333, 79 322
           C 85 288, 89 252, 91 220
           C 93 190, 96 164, 101 150
           Z"
        fill="var(--skin-base)"
      />
      {/* right arm */}
      <path
        d="M 208 128
           C 216 150, 220 182, 221 214
           C 223 248, 228 285, 231 318
           C 234 332, 236 344, 232 353
           C 227 346, 224 333, 221 322
           C 215 288, 211 252, 209 220
           C 207 190, 204 164, 199 150
           Z"
        fill="var(--skin-base)"
      />

      {/* body: neck → shoulders → torso → hips → legs → feet */}
      <path
        d="M 141 88
           C 141 100, 138 108, 127 114
           C 112 120, 100 122, 93 127
           C 88 133, 92 142, 99 152
           C 106 168, 110 196, 114 228
           C 117 258, 106 278, 97 302
           C 92 330, 96 362, 103 392
           C 112 430, 121 452, 125 482
           C 128 512, 127 528, 128 552
           C 130 582, 137 610, 141 632
           C 140 646, 137 656, 135 662
           C 139 668, 146 668, 147 660
           C 148 650, 148 640, 147 630
           C 147 580, 148 500, 149 452
           L 150 340
           L 151 452
           C 152 500, 153 580, 153 630
           C 152 640, 152 650, 153 660
           C 154 668, 161 668, 165 662
           C 163 656, 160 646, 159 632
           C 163 610, 170 582, 172 552
           C 173 528, 172 512, 175 482
           C 179 452, 188 430, 197 392
           C 204 362, 208 330, 203 302
           C 194 278, 183 258, 186 228
           C 190 196, 194 168, 201 152
           C 208 142, 212 133, 207 127
           C 200 122, 188 120, 173 114
           C 162 108, 159 100, 159 88
           C 153 92, 147 92, 141 88
           Z"
        fill="var(--skin-base)"
      />

      {/* soft shading: inner thighs + waist */}
      <path
        d="M 149 452 L 150 340 L 151 452 C 151 470 149 470 149 452 Z"
        fill="var(--skin-shadow)"
        opacity="0.6"
      />
      <path
        d="M 114 228 C 130 238, 170 238, 186 228 C 170 244, 130 244, 114 228 Z"
        fill="var(--skin-shadow)"
        opacity="0.35"
      />
    </svg>
  );
}
