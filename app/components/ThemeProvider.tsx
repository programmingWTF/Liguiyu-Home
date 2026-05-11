"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  resolved: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "system",
  setMode: () => {},
  resolved: "light",
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("liguiyu-theme") as ThemeMode | null;
    if (stored && ["light", "dark", "system"].includes(stored)) {
      setModeState(stored);
    }
    // No stored preference = first visit, stay on dark (default)
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem("liguiyu-theme", m);
  };

  // Resolve system preference
  useEffect(() => {
    const resolve = () => {
      if (mode === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setResolved(prefersDark ? "dark" : "light");
      } else {
        setResolved(mode);
      }
    };
    resolve();

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", resolve);
    return () => mq.removeEventListener("change", resolve);
  }, [mode]);

  // Apply class to html
  useEffect(() => {
    if (resolved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [resolved]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}
