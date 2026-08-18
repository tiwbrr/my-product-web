import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getProducts, getStoreSettings } from "@/lib/store";
import { ContactSection } from "@/app/ui/contact-section";
import { StoreHeader } from "@/app/ui/store-header";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, user, settings] = await Promise.all([
    getProducts(),
    getCurrentUser(),
    getStoreSettings(),
  ]);

  return <main>
    <StoreHeader user={user} />
    <section className="hero">
      <div className="hero-copy"><span className="eyebrow">EVERYDAY ESSENTIALS · 2026</span><h1>ของดีที่เลือกมา<br />ให้ทุกวันของคุณ</h1><p>สินค้าดีไซน์เรียบ คุณภาพดี ใช้งานได้จริง—คัดสรรทีละชิ้นเพื่อให้คุณเลือกซื้อได้อย่างสบายใจ</p><a className="button button-dark" href="#products">เลือกดูสินค้า <span>↓</span></a></div>
      <div className="hero-art" aria-hidden="true"><div className="hero-stamp">CURATED<br /><strong>WITH CARE</strong></div><div className="hero-card hero-card-back"><span>QUALITY</span></div><div className="hero-card hero-card-front"><span>MY STORE</span><b>Simple goods.<br />Better days.</b></div></div>
    </section>
    <section className="product-section" id="products">
      <div className="section-heading"><div><span className="eyebrow">OUR COLLECTION</span><h2>สินค้าทั้งหมด</h2></div><p>{products.length} รายการที่คัดสรรมาเพื่อคุณ</p></div>
      {products.length ? <div className="product-grid">{products.map((product, index) => <article className="product-card" key={product.id}>
        <Link href={`/products/${product.id}`} className="product-image-wrap">{product.images[0] ? <img src={product.images[0]} alt={product.name} className="product-image" /> : <div className={`product-placeholder tone-${index % 3}`}><span>{product.category}</span></div>}{product.featured && <span className="product-badge">แนะนำ</span>}{product.images.length > 1 && <span className="image-count">{product.images.length} รูป</span>}</Link>
        <div className="product-info"><div className="product-meta"><span>{product.category}</span><span>{product.stock > 0 ? `เหลือ ${product.stock} ชิ้น` : "สินค้าหมด"}</span></div><h3><Link href={`/products/${product.id}`}>{product.name}</Link></h3><p>{product.description}</p><div className="product-bottom"><strong>฿{product.price.toLocaleString("th-TH")}</strong><Link href={`/products/${product.id}`}>ดูรายละเอียด →</Link></div></div>
      </article>)}</div> : <div className="empty-state"><span>◌</span><h3>กำลังเตรียมสินค้าใหม่</h3><p>แอดมินสามารถเพิ่มสินค้าชิ้นแรกได้จากหน้าจัดการ</p>{user?.role === "admin" && <Link className="button button-dark" href="/admin">เพิ่มสินค้า</Link>}</div>}
    </section>
    <ContactSection settings={settings} />
    <section className="member-banner"><div><span className="eyebrow">MY STORE MEMBER</span><h2>เป็นสมาชิก แล้วติดตามร้านได้ง่ายกว่า</h2><p>สมัครฟรี เก็บข้อมูลบัญชีของคุณไว้สำหรับสิทธิประโยชน์และฟีเจอร์ใหม่ในอนาคต</p></div>{!user && <Link href="/register" className="button button-light">สมัครสมาชิกฟรี →</Link>}</section>
    <footer><Link href="/" className="brand brand-light"><span>M</span> MY STORE</Link><p>© 2026 My Store. Simple goods, better days.</p></footer>
  </main>;
}
