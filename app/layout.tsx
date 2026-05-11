import type { Metadata } from "next";
import { Inter, Geist_Mono, Lora } from "next/font/google";
import Providers from "./components/Providers";
import "./globals.css";

const lora = Lora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "李桂聿 · liguiyu.com",
  description:
    "全栈开发者 · AI 基础设施工程师 · 底层玩家。我让机器学会思考。",
  keywords: ["李桂聿", "全栈开发", "AI", "OpenClaw", "3D打印", "基础设施"],
  openGraph: {
    title: "李桂聿 · liguiyu.com",
    description: "全栈开发者 · AI 基础设施工程师 · 底层玩家",
    type: "website",
    locale: "zh_CN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${lora.variable} ${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
