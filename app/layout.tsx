import type { Metadata } from "next";
import { Geist, Noto_Sans_Thai } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const notoThai = Noto_Sans_Thai({ variable: "--font-thai", subsets: ["thai"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Kuozo Shop — ร้านไอดีเกม", template: "%s | Kuozo Shop" },
  description: "ร้านรวมไอดีเกม Genshin, Wuthering Wave และเกมอื่นๆ ดูรูปและรายละเอียดไอดีได้ก่อนติดต่อร้าน",
  openGraph: { title: "Kuozo Shop — ร้านไอดีเกม", description: "เลือกดูไอดีเกมที่ต้องการได้ง่ายตามหมวดหมู่", images: [{ url: "/og-kuozo-shop.png", width: 1731, height: 909, alt: "Kuozo Shop — Game Account Store" }] },
  twitter: { card: "summary_large_image", images: ["/og-kuozo-shop.png"] },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="th" className={`${geist.variable} ${notoThai.variable}`}><body>{children}</body></html>;
}
