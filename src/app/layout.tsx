import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Native City — 오늘, 누구랑 놀까?",
  description:
    "취향이 맞는 AI 친구와 나만의 서울 찾기. 친구를 고르고 바로 대화해 보세요.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-visual",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-paper font-sans text-ink">{children}</body>
    </html>
  );
}
