"use client";

import { useEffect, useRef } from "react";

const ALERTS: Record<string, { icon: string; title: string; color: string; bg: string }> = {
  NOTE: { icon: "ℹ️", title: "Note", color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
  TIP: { icon: "💡", title: "Tip", color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
  IMPORTANT: { icon: "📌", title: "Important", color: "#8b5cf6", bg: "rgba(139,92,246,0.08)" },
  WARNING: { icon: "⚠️", title: "Warning", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  CAUTION: { icon: "🚨", title: "Caution", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
};

const MARKER_RE = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i;

function attachCopyButtons(root: HTMLElement) {
  root.querySelectorAll("pre").forEach(pre => {
    if (pre.closest(".code-wrapper")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "code-wrapper";
    wrapper.style.cssText = "position:relative;margin-bottom:1.5rem";
    pre.parentNode?.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);
    pre.style.margin = "0";

    const codeEl = pre.querySelector("code");
    const codeText = (codeEl ? codeEl.textContent : pre.textContent) || "";

    const btn = document.createElement("button");
    btn.className = "code-copy-btn";
    btn.innerHTML = "📋 复制";

    btn.addEventListener("click", function () {
      navigator.clipboard.writeText(codeText).then(function () {
        btn.innerHTML = "✅ 已复制";
        btn.classList.add("copied");
        setTimeout(function () {
          btn.innerHTML = "📋 复制";
          btn.classList.remove("copied");
        }, 2000);
      }).catch(function () {
        // fallback
        const range = document.createRange();
        range.selectNodeContents(codeEl || pre);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      });
    });

    wrapper.appendChild(btn);
  });
}

export default function ArticleContent({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // KaTeX
    if (!document.getElementById("katex-css")) { const l = document.createElement("link"); l.id = "katex-css"; l.rel = "stylesheet"; l.href = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css"; document.head.appendChild(l); }
    if (!document.getElementById("katex-js")) { const s = document.createElement("script"); s.id = "katex-js"; s.src = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"; s.onload = () => { renderMath(el); }; document.head.appendChild(s); } else { renderMath(el); }

    // highlight.js — attach copy buttons after highlighting
    if (!document.getElementById("hljs-css")) { const l = document.createElement("link"); l.id = "hljs-css"; l.rel = "stylesheet"; l.href = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/atom-one-dark.min.css"; document.head.appendChild(l); }
    if (!document.getElementById("hljs-js")) { const s = document.createElement("script"); s.id = "hljs-js"; s.src = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js"; s.onload = () => { (window as any).hljs?.highlightAll(); attachCopyButtons(el); }; document.head.appendChild(s); } else { (window as any).hljs?.highlightAll(); attachCopyButtons(el); }

    // === Step 1: Merge ALL adjacent non-marker blockquotes ===
    (function mergeAdjacent() {
      const bqs = Array.from(el.querySelectorAll("blockquote"));
      for (let i = 0; i < bqs.length; i++) {
        const bq = bqs[i];
        if (!bq.parentNode) continue;
        const firstP = bq.querySelector("p:first-child");
        if (firstP && MARKER_RE.test(firstP.innerHTML)) continue;
        
        // Collect adjacent non-marker blockquotes
        const toMerge: Element[] = [bq];
        let sibling = bq.nextElementSibling;
        while (sibling && sibling.tagName === "BLOCKQUOTE") {
          const np = sibling.querySelector("p:first-child");
          if (np && MARKER_RE.test(np.innerHTML)) break;
          toMerge.push(sibling);
          sibling = sibling.nextElementSibling;
        }
        
        // Merge: use textContent to strip > prefix cleanly
        const paragraphs: string[] = [];
        for (const b of toMerge) {
          const ps = b.querySelectorAll("p");
          ps.forEach(p => {
            let text = p.textContent || "";
            // Strip leading > and whitespace
            text = text.replace(/^\s*>\s*/, "");
            // Preserve inner HTML (strong, em, a, code, etc)
            let html = p.innerHTML;
            // If the first text node starts with >, remove it from innerHTML too
            html = html.replace(/^(\s*)>\s*/, "$1");
            paragraphs.push(`<p>${html}</p>`);
          });
        }
        
        if (toMerge.length > 1) {
          for (let j = 1; j < toMerge.length; j++) toMerge[j].remove();
          bq.innerHTML = paragraphs.join("");
          bq.style.cssText = "border-left:3px solid rgba(0,129,192,0.3);background:rgba(0,129,192,0.04);border-radius:10px;padding:12px 16px;margin:16px 0";
        }
      }
    })();

    // === Step 2: Process admonitions ===
    (function processAdmonitions() {
      const bqs = Array.from(el.querySelectorAll("blockquote"));
      for (let i = 0; i < bqs.length; i++) {
        const bq = bqs[i];
        if (!bq.parentNode) continue;
        const firstP = bq.querySelector("p:first-child");
        if (!firstP) continue;
        const match = firstP.innerHTML.match(MARKER_RE);
        if (!match) continue;
        
        const type = match[1].toUpperCase();
        const cfg = ALERTS[type];
        if (!cfg) continue;

        // Gather following non-marker blockquotes as content
        let contentHtml = "";
        let next = bq.nextElementSibling;
        while (next && next.tagName === "BLOCKQUOTE") {
          const np = next.querySelector("p:first-child");
          if (np && MARKER_RE.test(np.innerHTML)) break;
          contentHtml += next.innerHTML;
          const t = next; next = next.nextElementSibling; t.remove();
        }

        firstP.innerHTML = firstP.innerHTML.replace(MARKER_RE, "").replace(/^\s+/, "");

        const w = document.createElement("div");
        w.style.cssText = `border-left:3px solid ${cfg.color};background:${cfg.bg};border-radius:10px;padding:16px 20px;margin:20px 0`;
        w.innerHTML = `<div style="font-size:13px;font-weight:600;color:${cfg.color};margin-bottom:8px;font-family:var(--font-body)">${cfg.icon} ${cfg.title}</div>${bq.innerHTML}${contentHtml}`;
        bq.replaceWith(w);
      }
    })();

    // Tables
    el.querySelectorAll("table").forEach(t => {
      if (t.parentElement?.classList.contains("table-wrapper")) return;
      const w = document.createElement("div"); w.className = "table-wrapper";
      w.style.cssText = "overflow-x:auto;border-radius:12px;border:1px solid rgba(128,128,128,0.12);margin:20px 0";
      t.parentNode?.insertBefore(w, t); w.appendChild(t);
      t.style.cssText = "margin:0;width:100%";
    });

    // Attach copy buttons (may re-run after KaTeX / highlight.js finish)
    attachCopyButtons(el);
  }, [html]);

  return <div ref={ref} className="blog-content" dangerouslySetInnerHTML={{ __html: html }} style={{ fontFamily: "var(--font-body)", lineHeight: "1.85", fontSize: "16px" }} />;
}

function renderMath(el: HTMLElement) {
  if (!(window as any).katex) return;
  try {
    const k = (window as any).katex;
    let changed = false;
    let html = el.innerHTML;
    html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, f: string) => { changed = true; try { return k.renderToString(f.trim(), { displayMode: true, throwOnError: false }) } catch { return _ } });
    html = html.replace(/\$([^$]+?)\$/g, (_, f: string) => { changed = true; try { return k.renderToString(f.trim(), { displayMode: false, throwOnError: false }) } catch { return _ } });
    if (changed) {
      el.innerHTML = html;
      attachCopyButtons(el);
    }
  } catch {}
}
