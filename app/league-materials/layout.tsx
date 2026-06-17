import { ReactNode } from "react";
import PageGlow from "@/app/components/PageGlow";
import GlobalGrid from "@/app/components/GlobalGrid";
import ClickRipple from "@/app/components/ClickRipple";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export const dynamic = "force-dynamic";

export default function LeagueMaterialsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageGlow />
      <GlobalGrid />
      <ClickRipple />
      <Navbar />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
    </>
  );
}
