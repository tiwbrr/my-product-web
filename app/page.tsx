import Link from "next/link";
import { ContactSection } from "@/app/ui/contact-section";
import { ProductCatalog } from "@/app/ui/product-catalog";
import { StoreHeader } from "@/app/ui/store-header";
import { getCurrentUser } from "@/lib/auth";
import { getGameCategories, getProducts, getStoreSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, user, settings, categories] = await Promise.all([
    getProducts(),
    getCurrentUser(),
    getStoreSettings(),
    getGameCategories(),
  ]);
  return <main className="sell-site">
    <StoreHeader user={user} />
    <section className="sell-hero">
      <div className="sell-hero-banner"><img src="/og-sell-id.png" alt="Sell ID Game Account Store" /></div>
      <div className="sell-hero-copy"><span className="sell-kicker">WELCOME TO</span><h1>SELL ID</h1><p>ร้านรวมไอดีเกม Genshin และ Wuthering Wave<br />เลือกดูไอดีที่ต้องการได้จากหมวดหมู่ด้านล่าง</p><a href="#categories">เลือกหมวดหมู่เกม <b>↓</b></a></div>
    </section>
    <section className="sell-notice"><b>วิธีเลือกซื้อ</b><p>กดเมนูสามขีดมุมขวาบน หรือเลือกหมวดเกมด้านล่าง จากนั้นกดไอดีที่สนใจเพื่อดูรูปและรายละเอียดทั้งหมด หากต้องการสั่งซื้อให้ติดต่อร้านผ่าน LINE หรือ Facebook</p></section>
    <ProductCatalog products={products} categories={categories} />
    <ContactSection settings={settings} />
    <footer className="sell-footer"><Link href="/" className="game-brand game-brand-light"><span>S</span><b>SELL ID</b></Link><nav><a href="#categories">หมวดหมู่เกม</a><a href="#products">รายการไอดี</a><a href="#contact">ติดต่อร้าน</a></nav><p>© 2026 Sell ID. All rights reserved.</p></footer>
  </main>;
}
