"use client";

import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function LuxuryCursor() {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 300, mass: 0.2 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.closest("button") ||
          target.closest("a") ||
          target.closest("[data-cursor-hover]"))
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
    };
  }, [cursorX, cursorY]);

  if (!isVisible) return null;

  return (
    <>
      <style jsx global>{`
        @media (pointer: fine) {
          body,
          button,
          a,
          input,
          select,
          textarea {
            cursor: none !important;
          }
        }
      `}</style>

      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] flex items-center justify-center"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        <motion.div
          animate={{
            scale: isHovered ? 2.2 : 1,
            opacity: isHovered ? 0.9 : 0.7,
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative h-8 w-8 rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 blur-[2px] shadow-[0_0_20px_rgba(34,211,238,0.6),0_0_20px_rgba(236,72,153,0.6)]"
        >
          <div className="absolute inset-[2px] rounded-full bg-slate-950/40 backdrop-blur-3xl" />
          <div className="absolute inset-[6px] rounded-full bg-gradient-to-tr from-cyan-300 to-pink-400 opacity-80" />
        </motion.div>
      </motion.div>
    </>
  );
}