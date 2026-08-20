import Link from "next/link";
import { ChatRoom } from "@/app/ui/chat-room";
import { ContactSection } from "@/app/ui/contact-section";
import { ProductCatalog } from "@/app/ui/product-catalog";
import { StoreHeader } from "@/app/ui/store-header";
import { YouTubePlaylist } from "@/app/ui/youtube-playlist";
import { getCurrentUser } from "@/lib/auth";
import { parseCatalogFilters, type CatalogSearchParams } from "@/lib/catalog-filters";
import { getChatMessages, getGameCategories, getProducts, getStoreSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  const catalogFilters = parseCatalogFilters(await searchParams);
  const user = await getCurrentUser();
  const [products, settings, categories, messages] = await Promise.all([
    getProducts(),
    getStoreSettings(),
    getGameCategories(),
    user ? getChatMessages() : Promise.resolve([]),
  ]);
  return <main className="sell-site">
    <StoreHeader user={user} />
    <section className="sell-hero">
      <div className="sell-hero-banner"><img src="/og-kuozo-shop.png" alt="Kuozo Shop Game Account Store" /></div>
      <div className="sell-hero-copy"><span className="sell-kicker">WELCOME TO</span><h1>KUOZO SHOP</h1><p>ร้านรวมไอดีเกม Genshin, Wuthering Wave และเกมอื่นๆ<br />เลือกดูไอดีที่ต้องการได้จากหมวดหมู่ด้านล่าง</p><a href="#categories">เลือกหมวดหมู่เกม <b>↓</b></a></div>
    </section>
    <section className="sell-notice"><b>วิธีเลือกซื้อ</b><p>กดเมนูสามขีดมุมขวาบน หรือเลือกหมวดเกมด้านล่าง จากนั้นกดไอดีที่สนใจเพื่อดูรูปและรายละเอียดทั้งหมด หากต้องการสั่งซื้อให้ติดต่อร้านผ่าน LINE หรือ Facebook</p></section>
    <ProductCatalog products={products} categories={categories} initialFilters={catalogFilters} />
    <YouTubePlaylist url={settings.youtubePlaylistUrl} />
    {user ? <ChatRoom messages={messages} user={user} /> : <section className="chat-guest" id="chat"><span>MEMBER CHAT</span><h2>พูดคุยกับสมาชิกในร้าน</h2><p>สมัครสมาชิกหรือเข้าสู่ระบบเพื่ออ่านและส่งข้อความในแชท</p><div><Link href="/login" className="button button-light">เข้าสู่ระบบ</Link><Link href="/register" className="button chat-register-button">สมัครสมาชิก</Link></div></section>}
    <ContactSection settings={settings} />
    <footer className="sell-footer"><Link href="/" className="game-brand game-brand-light"><span>K</span><b>KUOZO SHOP</b></Link><nav><a href="#categories">หมวดหมู่เกม</a><a href="#products">รายการไอดี</a><a href="#chat">แชทสมาชิก</a><a href="#contact">ติดต่อร้าน</a></nav><p>© 2026 Kuozo Shop. All rights reserved.</p></footer>
  </main>;
}
