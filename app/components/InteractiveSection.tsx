"use client";

import { useRef, useEffect, useState, ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

type SectionTheme = "lab" | "blueprint" | "observatory";

interface InteractiveSectionProps {
  id: string;
  theme: SectionTheme;
  children: ReactNode;
  className?: string;
}

export default function InteractiveSection({
  id,
  theme,
  children,
  className = "",
}: InteractiveSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 30 });

  const geo1X = useTransform(springX, (v) => v * 16 - 8);
  const geo1Y = useTransform(springY, (v) => v * 16 - 8);
  const geo2X = useTransform(springX, (v) => -v * 12 + 6);
  const geo2Y = useTransform(springY, (v) => -v * 12 + 6);

  const accent = theme === "observatory" ? "#41a1cf" : "#0081c0";

  // ⚠️ Pre-generate observatory dots on client only
  const [obsDots, setObsDots] = useState<Array<{ w: number; h: number; t: string; l: string; bg: string; o: number }>>([]);
  useEffect(() => {
    if (theme === "observatory") {
      setObsDots(
        [...Array(12)].map(() => ({
          w: 3 + Math.random() * 5,
          h: 3 + Math.random() * 5,
          t: `${Math.random() * 100}%`,
          l: `${Math.random() * 100}%`,
          bg: `${accent}${30 + Math.floor(Math.random() * 35)}`,
          o: 0.6 + Math.random() * 0.4,
        }))
      );
    }
  }, [theme, accent]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleMouse = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouseX.set(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
      mouseY.set(Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)));
    };
    el.addEventListener("mousemove", handleMouse, { passive: true });
    return () => el.removeEventListener("mousemove", handleMouse);
  }, [mouseX, mouseY]);

  return (
    <section ref={ref} id={id} className={`relative min-h-screen flex flex-col justify-center py-24 px-6 overflow-hidden section-bg-unified ${className}`}>
      {/* Mouse-following glow handled globally by PageGlow */}

      {/* Geometric elements with mouse parallax + rotation */}
      <motion.div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ x: geo1X, y: geo1Y }}>
        {theme === "lab" && (
          <>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: "linear" }} className="absolute rounded-full" style={{ width: "400px", height: "400px", top: "5%", right: "-8%", border: `2px solid ${accent}40` }} />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 90, repeat: Infinity, ease: "linear" }} className="absolute rounded-full" style={{ width: "260px", height: "260px", top: "55%", left: "-5%", border: `1.5px solid ${accent}35` }} />
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 150, repeat: Infinity, ease: "linear" }} className="absolute rounded-full" style={{ width: "180px", height: "180px", top: "30%", right: "-5%", border: `1px solid ${accent}25` }} />
            <svg className="absolute" style={{ top: "12%", left: "8%", opacity: 0.22 }} width="180" height="200" viewBox="0 0 180 200">
              <polygon points="90,0 175,50 175,150 90,200 5,150 5,50" fill="none" stroke={accent} strokeWidth="1" />
            </svg>
            <svg className="absolute" style={{ bottom: "5%", right: "15%", opacity: 0.18 }} width="120" height="120" viewBox="0 0 100 100">
              <rect x="5" y="5" width="90" height="90" rx="12" fill="none" stroke={accent} strokeWidth="1" />
            </svg>
            <svg className="absolute" style={{ top: "70%", left: "25%", opacity: 0.16 }} width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="35" fill="none" stroke={accent} strokeWidth="1" strokeDasharray="8 4" />
            </svg>
            <svg className="absolute" style={{ top: "40%", left: "90%", opacity: 0.14 }} width="60" height="100" viewBox="0 0 60 100">
              <line x1="30" y1="5" x2="30" y2="95" stroke={accent} strokeWidth="0.8" />
              <line x1="5" y1="50" x2="55" y2="50" stroke={accent} strokeWidth="0.8" />
            </svg>
            <div className="absolute w-1 h-1 rounded-full" style={{ top: "20%", left: "75%", backgroundColor: `${accent}50` }} />
            <div className="absolute w-1 h-1 rounded-full" style={{ top: "80%", left: "70%", backgroundColor: `${accent}40` }} />
          </>
        )}
        {theme === "blueprint" && (
          <>
            {[420, 340, 260].map((size, i) => (
              <motion.div key={i} animate={{ rotate: (i % 2 === 0 ? 360 : -360) }} transition={{ duration: 150 + i * 30, repeat: Infinity, ease: "linear" }} className="absolute rounded-full" style={{ width: `${size}px`, height: `${size}px`, top: "18%", right: `-${size / 4}px`, border: `1.5px solid ${accent}${40 - i * 10}` }} />
            ))}
            <div className="absolute" style={{ top: "58%", left: "72%" }}>
              <svg width="50" height="50" viewBox="0 0 40 40" opacity={0.5}>
                <circle cx="20" cy="20" r="18" fill="none" stroke={accent} strokeWidth="0.8" />
                <line x1="20" y1="2" x2="20" y2="38" stroke={accent} strokeWidth="0.5" />
                <line x1="2" y1="20" x2="38" y2="20" stroke={accent} strokeWidth="0.5" />
              </svg>
            </div>
          </>
        )}
        {theme === "observatory" && (
          <>
            {obsDots.map((dot, i) => (
              <div key={`obs-dot-${i}`} className="absolute rounded-full" style={{ width: `${dot.w}px`, height: `${dot.h}px`, top: dot.t, left: dot.l, backgroundColor: dot.bg, opacity: dot.o }} />
            ))}
            <div className="absolute rounded-full" style={{ width: "600px", height: "600px", top: "50%", left: "50%", transform: "translate(-50%, -50%)", border: `1px solid ${accent}30` }} />
          </>
        )}
      </motion.div>

      {/* Layer 4: Accent dots — 3x bigger */}
      <motion.div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ x: geo2X, y: geo2Y }}>
        {theme === "lab" && (
          <>
            <div className="absolute w-3 h-3 rounded-full" style={{ top: "15%", left: "88%", backgroundColor: `${accent}70` }} />
            <div className="absolute w-3 h-3 rounded-full" style={{ top: "75%", left: "8%", backgroundColor: `${accent}55` }} />
            <div className="absolute w-2 h-2 rounded-full" style={{ top: "50%", left: "92%", backgroundColor: `${accent}45` }} />
            <div className="absolute w-2 h-2 rounded-full" style={{ top: "85%", left: "85%", backgroundColor: `${accent}40` }} />
          </>
        )}
        {theme === "blueprint" && (
          <>
            <div className="absolute w-3 h-3 rounded-full" style={{ top: "35%", left: "20%", backgroundColor: `${accent}60` }} />
            <div className="absolute w-3 h-3 rounded-full" style={{ top: "65%", left: "80%", backgroundColor: `${accent}50` }} />
          </>
        )}
      </motion.div>

      <div className="relative z-10 mx-auto max-w-[1200px]">{children}</div>
    </section>
  );
}
