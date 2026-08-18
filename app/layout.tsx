import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "팀플 시간표 조율",
  description: "팀원들의 시간표를 비교해서 팀플 가능한 시간을 추천해주는 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
