import type { Metadata } from "next";
import localFont from "next/font/local";
import Providers from "./components/Providers";
import "./globals.css";

const monaspaceRadonFrozen = localFont({
  variable: "--font-geist-mono",
  src: [
    {
      path: "./fonts/MonaspaceRadonFrozen-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/MonaspaceRadonFrozen-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/MonaspaceRadonFrozen-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/MonaspaceRadonFrozen-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
  ],
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
      className={`${monaspaceRadonFrozen.variable} h-full antialiased`}
      style={{ "--font-display": "Georgia, 'Noto Serif SC', 'Source Han Serif SC', 'PingFang SC', 'Microsoft YaHei', serif", "--font-body": "Georgia, 'Noto Serif SC', 'Source Han Serif SC', 'PingFang SC', 'Microsoft YaHei', serif" } as any}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
