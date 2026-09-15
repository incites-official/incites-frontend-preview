import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastViewport } from "@/components/feedback/Toast";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const pretendard = localFont({
  src: "../font/Pretendard-1.3.9/web/variable/woff2/PretendardVariable.woff2",
  display: "swap",
  style: "normal",
  weight: "45 920",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  title: { default: "INCITES", template: "%s | INCITES" },
  description: "INCITES 운영 관리 시스템",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className={pretendard.className}><AuthProvider>{children}<ToastViewport /></AuthProvider></body>
    </html>
  );
}
