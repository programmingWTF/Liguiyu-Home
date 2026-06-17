"use client";

import { useEffect, useRef } from "react";

/**
 * Animated gradient blobs that drift across all content sections.
 * Ultra-low opacity — adds life without competing with content.
 */
export default function AmbientBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let t = 0;
    let raf: number;

    const blobs = el.querySelectorAll<HTMLElement>(".ambient-blob");
    const animate = () => {
      t += 0.0003;
      blobs.forEach((blob, i) => {
        const phase = i * 1.8;
        const x = 50 + Math.sin(t * 1.3 + phase) * 35;
        const y = 50 + Math.cos(t * 0.9 + phase) * 30;
        const sx = 1 + Math.sin(t * 0.7 + phase) * 0.3;
        blob.style.transform = `translate(${x - 50}%, ${y - 50}%) scale(${sx})`;
      });
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Grain texture */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />

      {/* Gradient blobs */}
      <div
        className="ambient-blob absolute"
        style={{
          width: "60vw",
          height: "60vw",
          maxWidth: "900px",
          maxHeight: "900px",
          top: "15%",
          left: "10%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(217,119,87,0.04) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="ambient-blob absolute"
        style={{
          width: "50vw",
          height: "50vw",
          maxWidth: "700px",
          maxHeight: "700px",
          top: "50%",
          left: "60%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(232,149,122,0.035) 0%, transparent 70%)",
          filter: "blur(90px)",
        }}
      />
      <div
        className="ambient-blob absolute"
        style={{
          width: "55vw",
          height: "55vw",
          maxWidth: "800px",
          maxHeight: "800px",
          top: "80%",
          left: "25%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(217,119,87,0.03) 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />

      {/* Faint blueprint grid */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(217,119,87,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(217,119,87,0.3) 1px, transparent 1px)",
          backgroundSize: "100px 100px",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
        }}
      />
    </div>
  );
}
