"use client";

import { useMotionValue, useSpring, motion, useTransform } from "framer-motion";
import { useEffect } from "react";

/**
 * One continuous mouse-following glow across the entire page.
 * No seams — just one big light that follows the cursor everywhere.
 */
export default function PageGlow() {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 80, damping: 30 });
  const sy = useSpring(my, { stiffness: 80, damping: 30 });

  const glowX = useTransform(sx, (v) => v * 100);
  const glowY = useTransform(sy, (v) => v * 100);

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
      style={{ zIndex: 2 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: useTransform(
            [glowX, glowY],
            ([x, y]: number[]) =>
              `radial-gradient(700px circle at ${x}% ${y}%, rgba(0,129,192,0.16) 0%, transparent 60%)`
          ),
        } as any}
      />
    </motion.div>
  );
}
