import type { Metadata } from "next";
import "@fontsource/pretendard/400.css";
import "@fontsource/pretendard/500.css";
import "@fontsource/pretendard/600.css";
import "@fontsource/pretendard/700.css";
import "@fontsource/pretendard/800.css";
import "@fontsource/pretendard/900.css";
import "@fontsource/noto-serif-kr/700.css";
import "@fontsource/noto-serif-kr/900.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI EDU Showroom",
  description: "교사 연수용 앱 미리보기 라이브러리",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
