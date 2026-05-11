"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

/**
 * Global click ripple — tap anywhere for a blue ripple expansion.
 * Only fires on clicks on blue/pseudo-blue areas.
 */
export default function ClickRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  let nextId = 0;

  const addRipple = useCallback((x: number, y: number) => {
    const id = nextId++;
    setRipples((prev) => [...prev.slice(-8), { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 1200);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // Only ripple on content sections (not Hero, not Navbar)
      const target = e.target as HTMLElement;
      // Check if click is in a section with blue accents
      const inSection =
        target.closest("#tools") ||
        target.closest("#about") ||
        target.closest("#blog") ||
        target.closest("#blog-list") ||
        target.closest("#blog-post");
      if (!inSection) return;
      addRipple(e.clientX, e.clientY);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [addRipple]);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 999 }}>
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.div
            key={r.id}
            className="absolute rounded-full"
            style={{
              left: r.x,
              top: r.y,
              x: "-50%",
              y: "-50%",
              border: "1.5px solid rgba(0,129,192,0.5)",
              boxShadow: "0 0 20px rgba(0,129,192,0.15)",
            }}
            initial={{ width: 0, height: 0, opacity: 0.7 }}
            animate={{ width: 200, height: 200, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
