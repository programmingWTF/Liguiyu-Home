"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./ThemeProvider";
import { ReactNode } from "react";

const isAdminMode = process.env.NEXT_PUBLIC_ADMIN_MODE === "true";

export default function Providers({ children }: { children: ReactNode }) {
  // 管理后台实例：Cloudflare Zero Trust 在外层处理认证，应用层无需 SessionProvider
  if (isAdminMode) {
    return <ThemeProvider>{children}</ThemeProvider>;
  }

  return (
    <SessionProvider refetchOnWindowFocus={true} refetchInterval={5}>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}
