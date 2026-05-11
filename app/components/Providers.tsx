"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./ThemeProvider";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={true} refetchInterval={5}>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}
