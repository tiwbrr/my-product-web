import type { Metadata } from "next";
import { Geist, Noto_Sans_Thai } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const notoThai = Noto_Sans_Thai({ variable: "--font-thai", subsets: ["thai"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "My Store — ของดีสำหรับทุกวัน", template: "%s | My Store" },
  description: "ร้านXXXXไลฟ์สไตล์ที่คัดสรรของดี ใช้งานง่าย สำหรับทุกวันของคุณ",
  openGraph: { title: "My Store — Simple goods. Better days.", description: "ของดีที่เลือกมาให้ทุกวันของคุณ", images: [{ url: "/og.png", width: 1200, height: 630, alt: "My Store" }] },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="th" className={`${geist.variable} ${notoThai.variable}`}><body>{children}</body></html>;
}
