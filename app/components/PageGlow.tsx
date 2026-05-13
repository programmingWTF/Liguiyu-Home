"use client";

import { useMotionValue, motion, useTransform } from "framer-motion";
import { useEffect } from "react";

/**
 * Single smooth blue glow via screen blend.
 * Uses a pale blue-white so text near the cursor becomes visibly lighter.
 */
export default function PageGlow() {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);

  const glowX = useTransform(mx, (v) => v * 100);
  const glowY = useTransform(my, (v) => v * 100);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth);
      my.set(e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 2, mixBlendMode: "screen" } as any}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: useTransform(
            [glowX, glowY],
            ([x, y]: number[]) =>
              `radial-gradient(600px circle at ${x}% ${y}%, rgba(70,140,210,0.24) 0%, rgba(40,110,190,0.08) 50%, transparent 75%)`
          ),
        } as any}
      />
    </motion.div>
  );
}
