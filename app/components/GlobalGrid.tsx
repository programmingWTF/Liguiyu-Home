"use client";

import { useMotionValue, useSpring, motion } from "framer-motion";
import { useEffect } from "react";

/**
 * Full-page continuous blueprint grid that shifts with mouse.
 * Placed once above all sections — no seams.
 */
export default function GlobalGrid() {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 30, damping: 40 });
  const sy = useSpring(my, { stiffness: 30, damping: 40 });

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
      style={{
        zIndex: 1,
        rotateX: useMotionValue(0), // placeholder, css-only grid
        rotateY: useMotionValue(0),
        transformPerspective: 1000,
      }}
    >
      <div
        className="absolute inset-0 global-grid-layer"
        style={{
          opacity: 0.12,
          backgroundImage:
            "linear-gradient(rgba(0,129,192,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(0,129,192,0.25) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 5%, black 92%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 5%, black 92%, transparent 100%)",
        }}
      />
    </motion.div>
  );
}
