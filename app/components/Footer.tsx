"use client";

import { Mail, MessageCircle } from "lucide-react";

function GithubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

const contacts: { label: string; icon: any; href?: string; detail?: string }[] = [
  { label: "GitHub", icon: GithubIcon, href: "https://github.com/programmingWTF" },
  { label: "QQ", icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21.395 15.035a39.548 39.548 0 0 0-.803-2.264l-1.079-2.695c.001-.032.014-.562.014-.836C19.526 4.632 17.351 0 12 0S4.474 4.632 4.474 9.241c0 .274.013.804.014.836l-1.08 2.695a38.97 38.97 0 0 0-.802 2.264c-1.021 3.283-.69 4.643-.438 4.673.54.065 2.103-2.472 2.103-2.472 0 1.469.756 3.387 2.394 4.771-.612.188-1.363.479-1.845.835-.434.32-.379.646-.301.778.343.578 5.883.369 7.482.369 1.598 0 7.138.209 7.481-.369.078-.132.132-.458-.301-.778-.482-.356-1.233-.646-1.846-.835 1.637-1.384 2.393-3.302 2.393-4.771 0 0 1.563 2.537 2.103 2.472.251-.03.581-1.39-.438-4.673z"/></svg>, detail: "3477492305" },
  { label: "微信", icon: MessageCircle, detail: "liguiyu666666666666" },
  { label: "邮箱", icon: Mail, detail: "3477492305@qq.com" },
];

export default function Footer() {
  return (
    <footer className="py-20 px-6" style={{ backgroundColor: "#1f1f29" }}>
      <div className="mx-auto max-w-[1200px] flex flex-col items-center text-center">
        <div id="footer-contact">
        <h3 className="text-[16px] font-[500] mb-8 tracking-[0.08em] uppercase" style={{ fontFamily: "var(--font-body)", color: "rgba(222,226,222,0.4)" }}>
          — Let&apos;s Connect —
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-[560px] mb-16">
          {contacts.map((c) => (
            <button
              key={c.label}
              onClick={(e) => {
                e.preventDefault();
                if (c.href) { window.open(c.href, "_blank"); return; }
                if (c.detail) alert(`${c.label}: ${c.detail}`);
              }}
              className="group flex flex-col items-center gap-3 px-4 py-5 rounded-[14px] border-none cursor-pointer transition-all hover:scale-110"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", fontFamily: "var(--font-body)" }}
            >
              <div className="transition-colors duration-300" style={{ color: "rgba(222,226,222,0.5)" }}>
                <c.icon size={20} />
              </div>
              <span className="text-[13px] font-[500] transition-colors group-hover:text-[#e8957a]" style={{ color: "rgba(222,226,222,0.5)" }}>
                {c.label}
              </span>
            </button>
          ))}
        </div>

        </div>

        <p className="text-[20px] font-[400] mb-12" style={{ fontFamily: "var(--font-display)", color: "rgba(222,226,222,0.45)", letterSpacing: "0.04em" }}>
          Artificial Intelligence @ NUAA
        </p>

        <div className="w-full pt-8 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid rgba(222,226,222,0.08)" }}>
          <span className="text-[13px] font-[400]" style={{ fontFamily: "var(--font-body)", color: "rgba(222,226,222,0.4)" }}>
            liguiyu.com © {new Date().getFullYear()} All Rights Reserved
          </span>
        </div>
      </div>
    </footer>
  );
}
