"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";

interface TocItem { id: string; text: string; level: number; }

function extractToc(html: string): TocItem[] {
  const items: TocItem[] = [];
  const regex = /<h([23])\s[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[23]>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    items.push({ level: parseInt(match[1]), id: match[2], text: match[3].replace(/<[^>]*>/g, "") });
  }
  return items;
}

export default function ArticleToc({ html }: { html: string }) {
  const items = useMemo(() => extractToc(html), [html]);
  const [open, setOpen] = useState(true);
  const [activeId, setActiveId] = useState("");

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
    onScroll(); // initial check
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

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
            style={{ backdropFilter: "blur(32px)", backgroundColor: "rgba(10,15,24,0.92)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="px-6 pt-24 pb-8">
              <h4 className="blog-toc-title text-[12px] font-[600] tracking-[0.06em] uppercase mb-5" style={{ fontFamily: "var(--font-body)" }}>目录</h4>
              <ul className="list-none p-0 m-0 space-y-1.5">
                {items.map((item, i) => (
                  <li key={`${item.id}__${i}`} style={{ paddingLeft: item.level === 3 ? "16px" : "0" }}>
                    <a href={`#${item.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" }); }}
                      className="no-underline block py-1 text-[13px] leading-[1.5] transition-all"
                      style={{ fontFamily: "var(--font-body)", color: activeId === item.id ? "#0081c0" : "rgba(255,255,255,0.45)", fontWeight: activeId === item.id ? 600 : 400,
                        borderLeft: activeId === item.id ? "2px solid #0081c0" : "2px solid transparent", paddingLeft: activeId === item.id ? "10px" : "8px" }}>
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
