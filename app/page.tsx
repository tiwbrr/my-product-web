import Link from "next/link";
import { ContactSection } from "@/app/ui/contact-section";
import { StoreHeader } from "@/app/ui/store-header";
import { getCurrentUser } from "@/lib/auth";
import { getProducts, getStoreSettings } from "@/lib/store";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

function ProductCard({ product, index }: { product: Product; index: number }) {
  return <article className="product-card">
    <Link href={`/products/${product.id}`} className="product-image-wrap">
      {product.images[0]
        ? <img src={product.images[0]} alt={product.name} className="product-image" />
        : <div className={`product-placeholder tone-${index % 3}`}><span>พื้นที่รูปสินค้า</span></div>}
      {product.featured && <span className="product-badge">แนะนำ</span>}
      {product.images.length > 1 && <span className="image-count">{product.images.length} รูป</span>}
    </Link>
    <div className="product-info">
      <div className="product-meta"><span>{product.category}</span><span>{product.stock > 0 ? `พร้อมจำหน่าย ${product.stock} ชิ้น` : "สินค้าหมด"}</span></div>
      <h3><Link href={`/products/${product.id}`}>{product.name}</Link></h3>
      <p>{product.description}</p>
      <div className="product-bottom"><strong>฿{product.price.toLocaleString("th-TH")}</strong><Link href={`/products/${product.id}`}>ดูรายละเอียด →</Link></div>
    </div>
  </article>;
}

export default async function Home() {
  const [products, user, settings] = await Promise.all([
    getProducts(),
    getCurrentUser(),
    getStoreSettings(),
  ]);
  const categories = [...new Set(products.map((product) => product.category))];
  const featuredProducts = products.filter((product) => product.featured).slice(0, 6);
  const highlights = featuredProducts.length ? featuredProducts : products.slice(0, 6);

  return <main>
    <div className="announcement-bar"><span>พร้อมให้บริการและตอบคำถามเกี่ยวกับสินค้า</span><a href="#contact">ติดต่อร้านค้า →</a></div>
    <StoreHeader user={user} />

    <section className="market-hero">
      <div className="market-hero-copy">
        <span className="eyebrow">WELCOME TO MY STORE</span>
        <h1>สินค้าคัดสรร<br />สำหรับทุกวันของคุณ</h1>
        <p>รวมสินค้าคุณภาพที่เลือกมาอย่างใส่ใจ ดูรายละเอียดได้ครบ และสอบถามร้านค้าได้โดยตรงผ่านช่องทางที่คุณสะดวก</p>
        <div className="hero-actions"><a className="button button-light" href="#featured">ดูสินค้าแนะนำ</a><a className="hero-text-link" href="#about">รู้จักร้านของเรา →</a></div>
      </div>
      <div className="promo-grid" aria-label="พื้นที่สำหรับรูปโปรโมชัน">
        <div className="promo-main"><span>พื้นที่รูปหลัก</span><b>ใส่ภาพโปรโมชัน<br />ของร้านภายหลัง</b></div>
        <div className="promo-small promo-orange"><span>NEW ARRIVAL</span><b>พื้นที่รูปสินค้าใหม่</b></div>
        <div className="promo-small promo-lime"><span>OUR PICK</span><b>พื้นที่รูปสินค้าแนะนำ</b></div>
      </div>
    </section>

    <section className="category-section">
      <div className="section-heading"><div><span className="eyebrow">SHOP BY CATEGORY</span><h2>เลือกดูตามหมวดหมู่</h2></div><a href="#all-products">ดูสินค้าทั้งหมด →</a></div>
      {categories.length ? <div className="category-grid">{categories.map((category, index) => {
        const count = products.filter((product) => product.category === category).length;
        return <a href="#all-products" className={`category-card category-tone-${index % 4}`} key={category}><span>{String(index + 1).padStart(2, "0")}</span><div><b>{category}</b><small>{count} รายการ</small></div><i>→</i></a>;
      })}</div> : <div className="category-grid category-grid-empty"><div className="category-card"><span>01</span><div><b>หมวดหมู่สินค้า</b><small>เพิ่มสินค้าจากหน้าแอดมิน</small></div></div></div>}
    </section>

    <section className="featured-section" id="featured">
      <div className="section-heading"><div><span className="eyebrow">FEATURED PRODUCTS</span><h2>สินค้าแนะนำ</h2></div><p>สินค้าที่ร้านอยากแนะนำให้คุณรู้จัก</p></div>
      {highlights.length ? <div className="product-grid">{highlights.map((product, index) => <ProductCard product={product} index={index} key={product.id} />)}</div> : <div className="empty-state"><span>◌</span><h3>กำลังเตรียมสินค้าแนะนำ</h3><p>สามารถเพิ่มและเลือกสินค้าแนะนำได้จากหน้าจัดการ</p>{user?.role === "admin" && <Link className="button button-dark" href="/admin">เพิ่มสินค้า</Link>}</div>}
    </section>

    <section className="catalog-section" id="all-products">
      <div className="section-heading"><div><span className="eyebrow">ALL PRODUCTS</span><h2>สินค้าทั้งหมด</h2></div><p>{products.length} รายการในร้าน</p></div>
      {products.length ? <div className="product-grid">{products.map((product, index) => <ProductCard product={product} index={index} key={product.id} />)}</div> : <div className="empty-state"><h3>ยังไม่มีสินค้า</h3><p>เมื่อเพิ่มสินค้าแล้ว รายการจะแสดงในส่วนนี้อัตโนมัติ</p></div>}
    </section>

    <section className="news-section" id="news">
      <div className="section-heading"><div><span className="eyebrow">NEWS & UPDATES</span><h2>ข่าวสารและเรื่องน่ารู้</h2></div><p>พื้นที่สำหรับอัปเดตข่าวและโปรโมชันของร้าน</p></div>
      <div className="news-grid">
        <article><div className="news-placeholder"><span>พื้นที่รูปข่าว</span></div><small>ข่าวสารร้านค้า</small><h3>อัปเดตสินค้าเข้าใหม่ประจำเดือน</h3><p>ใช้พื้นที่นี้แจ้งสินค้าใหม่ โปรโมชัน หรือประกาศสำคัญจากร้าน</p></article>
        <article><div className="news-placeholder news-placeholder-green"><span>พื้นที่รูปบทความ</span></div><small>คู่มือเลือกสินค้า</small><h3>เลือกสินค้าอย่างไรให้เหมาะกับการใช้งาน</h3><p>เพิ่มบทความแนะนำหรือข้อมูลที่ช่วยให้ลูกค้าตัดสินใจได้ง่ายขึ้น</p></article>
        <article><div className="news-placeholder news-placeholder-orange"><span>พื้นที่รูปโปรโมชัน</span></div><small>โปรโมชัน</small><h3>ติดตามสิทธิพิเศษจากทางร้าน</h3><p>แจ้งช่องทางติดตามข่าวสารและข้อเสนอใหม่ให้ลูกค้าไม่พลาดทุกอัปเดต</p></article>
      </div>
    </section>

    <section className="about-section" id="about">
      <div className="about-visual"><span>พื้นที่รูปเกี่ยวกับร้าน</span><strong>OUR<br />STORY</strong></div>
      <div className="about-copy"><span className="eyebrow">ABOUT OUR STORE</span><h2>ร้านที่ตั้งใจเลือก<br />สิ่งดี ๆ มาให้คุณ</h2><p>เราให้ความสำคัญกับคุณภาพ รายละเอียด และการใช้งานจริง เพื่อให้ทุกสินค้าที่นำเสนอเป็นตัวเลือกที่ดีสำหรับลูกค้า สามารถดูข้อมูลสินค้าและสอบถามเพิ่มเติมกับร้านได้โดยตรง</p><a href="#contact" className="button button-dark">พูดคุยกับเรา</a></div>
    </section>

    <section className="why-section">
      <div className="why-heading"><span className="eyebrow">WHY CHOOSE US</span><h2>ทำไมต้องเลือกเรา</h2><p>ประสบการณ์เลือกสินค้าที่เรียบง่าย พร้อมข้อมูลและช่องทางติดต่อที่ชัดเจน</p></div>
      <div className="benefit-grid"><article><span>01</span><h3>คัดสรรอย่างใส่ใจ</h3><p>เลือกรายการสินค้าที่เน้นคุณภาพและเหมาะกับการใช้งานจริง</p></article><article><span>02</span><h3>รายละเอียดครบถ้วน</h3><p>ดูราคา สถานะ และรูปสินค้าได้หลายมุมก่อนตัดสินใจ</p></article><article><span>03</span><h3>ติดต่อร้านได้โดยตรง</h3><p>สอบถามเพิ่มเติมได้ง่ายผ่าน LINE และ Facebook ของร้าน</p></article></div>
    </section>

    <ContactSection settings={settings} />

    <section className="member-banner"><div><span className="eyebrow">MY STORE MEMBER</span><h2>เป็นสมาชิก แล้วติดตามร้านได้ง่ายกว่า</h2><p>สมัครฟรีเพื่อเตรียมพร้อมสำหรับสิทธิประโยชน์และฟีเจอร์ใหม่ในอนาคต</p></div>{!user && <Link href="/register" className="button button-light">สมัครสมาชิกฟรี →</Link>}</section>

    <footer className="site-footer">
      <div className="footer-brand"><Link href="/" className="brand brand-light"><span>M</span> MY STORE</Link><p>สินค้าคัดสรรสำหรับทุกวันของคุณ</p></div>
      <div><b>เมนูหลัก</b><a href="#featured">สินค้าแนะนำ</a><a href="#all-products">สินค้าทั้งหมด</a><a href="#about">เกี่ยวกับเรา</a></div>
      <div><b>ช่วยเหลือ</b><a href="#contact">ติดต่อเรา</a><Link href="/login">เข้าสู่ระบบ</Link><Link href="/register">สมัครสมาชิก</Link></div>
      <div><b>ติดตามร้าน</b>{settings.facebookUrl && <a href={settings.facebookUrl} target="_blank" rel="noreferrer">Facebook ↗</a>}{settings.lineQrImage && <a href="#contact">LINE QR Code</a>}<small>© 2026 My Store</small></div>
    </footer>
  </main>;
}
