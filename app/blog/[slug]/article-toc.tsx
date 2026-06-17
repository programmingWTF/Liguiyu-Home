"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";

interface TocItem { id: string; text: string; level: number; }

/** 解码 HTML 实体（&quot; &amp; &lt; &gt; &#x...; 等） */
function decodeEntities(raw: string): string {
  if (typeof document === "undefined") return raw;
  const txt = document.createElement("textarea");
  txt.innerHTML = raw;
  return txt.value;
}

function extractToc(html: string): TocItem[] {
  const items: TocItem[] = [];
  const regex = /<h([2-4])\s[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[2-4]>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    items.push({ level: parseInt(match[1]), id: match[2], text: decodeEntities(match[3].replace(/<[^>]*>/g, "")) });
  }
  return items;
}

export default function ArticleToc({ html }: { html: string }) {
  const items = useMemo(() => extractToc(html), [html]);
  const [open, setOpen] = useState(true);
  const [activeId, setActiveId] = useState("");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0 });
  const listRef = useRef<HTMLUListElement>(null);

  // Scroll spy
  useEffect(() => {
    if (items.length === 0) return;

    const onScroll = () => {
      let current = "";
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120) current = item.id;
      }
      if (current) setActiveId(current);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  // Floating hover indicator — same spring physics as Navbar
  const handleHover = useCallback(
    (index: number | null, e?: React.MouseEvent<HTMLAnchorElement>) => {
      setHoveredIndex(index);
      if (index !== null && e && listRef.current) {
        const listRect = listRef.current.getBoundingClientRect();
        const targetRect = e.currentTarget.getBoundingClientRect();
        setIndicatorStyle({
          top: targetRect.top - listRect.top,
          height: targetRect.height,
        });
      }
    },
    []
  );

  if (items.length === 0) return null;

  return (
    <>
      <motion.button
        animate={{ left: open ? 220 : 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => setOpen(!open)}
        className="toc-toggle-btn fixed z-50 w-9 h-9 rounded-[8px] border-none cursor-pointer flex items-center justify-center"
        style={{ top: "50%", transform: "translateY(-50%)" }}>
        <motion.span animate={{ rotate: open ? 0 : 180 }} transition={{ duration: 0.3 }} style={{ display: "flex" }}>
          <ChevronLeft size={14} />
        </motion.span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.aside initial={{ x: -260, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -260, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="blog-sidebar fixed left-0 top-0 h-full w-[260px] z-40 overflow-y-auto"
            style={{ backdropFilter: "blur(32px)", backgroundColor: "rgba(24,22,19,0.92)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="px-6 pt-24 pb-8">
              <h4 className="blog-toc-title text-[12px] font-[600] tracking-[0.06em] uppercase mb-5" style={{ fontFamily: "var(--font-body)" }}>目录</h4>
              <ul ref={listRef} className="list-none p-0 m-0 relative" onMouseLeave={() => handleHover(null)}>
                {/* Floating hover indicator — mimics Navbar's hover effect */}
                <motion.div
                  className="absolute left-0 right-0 rounded-[8px] pointer-events-none z-0"
                  animate={
                    hoveredIndex !== null
                      ? {
                          y: indicatorStyle.top,
                          height: indicatorStyle.height,
                          opacity: 1,
                        }
                      : { opacity: 0 }
                  }
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                />
                {items.map((item, i) => (
                  <li key={`${item.id}__${i}`} style={{ paddingLeft: item.level === 3 ? "16px" : item.level >= 4 ? "32px" : "0" }}>
                    <a href={`#${item.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" }); }}
                      onMouseEnter={(e) => handleHover(i, e)}
                      className="relative z-10 no-underline block py-1 text-[13px] leading-[1.5] transition-colors rounded-[8px] px-2"
                      style={{ fontFamily: "var(--font-body)", color: activeId === item.id ? "#e8957a" : "rgba(255,255,255,0.45)", fontWeight: activeId === item.id ? 600 : 400,
                        borderLeft: activeId === item.id ? "2px solid #e8957a" : "2px solid transparent", paddingLeft: activeId === item.id ? "10px" : "8px" }}>
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
