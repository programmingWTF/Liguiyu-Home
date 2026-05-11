"use client";

import { motion } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, ThemeMode } from "./ThemeProvider";

const modes: { key: ThemeMode; icon: typeof Sun; label: string }[] = [
  { key: "light", icon: Sun, label: "浅色" },
  { key: "dark", icon: Moon, label: "深色" },
  { key: "system", icon: Monitor, label: "系统" },
];

export default function ThemeToggle({ isDark }: { isDark: boolean }) {
  const { mode, setMode } = useTheme();

  return (
    <div className="flex items-center gap-0.5 rounded-[8px] p-0.5" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}>
      {modes.map((m) => {
        const active = mode === m.key;
        return (
          <motion.button
            key={m.key}
            onClick={() => setMode(m.key)}
            whileTap={{ scale: 0.92 }}
            className="relative flex items-center justify-center w-8 h-8 rounded-[6px] border-none cursor-pointer transition-colors"
            style={{
              backgroundColor: active
                ? isDark
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(0,0,0,0.06)"
                : "transparent",
              color: isDark ? "rgba(255,255,255,0.6)" : "#646464",
            }}
            title={m.label}
          >
            <m.icon size={15} />
            {active && (
              <motion.div
                layoutId="theme-indicator"
                className="absolute inset-0 rounded-[6px]"
                style={{
                  backgroundColor: isDark ? "rgba(0,129,192,0.25)" : "rgba(0,129,192,0.12)",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
