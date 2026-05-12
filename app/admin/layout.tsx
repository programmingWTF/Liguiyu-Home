import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "管理后台 · liguiyu.com",
  robots: "noindex, nofollow",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
