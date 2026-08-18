import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactSection } from "@/app/ui/contact-section";
import { ProductGallery } from "@/app/ui/product-gallery";
import { StoreHeader } from "@/app/ui/store-header";
import { getCurrentUser } from "@/lib/auth";
import { getProduct, getStoreSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, user, settings] = await Promise.all([
    getProduct(id),
    getCurrentUser(),
    getStoreSettings(),
  ]);
  if (!product) notFound();
  return <main className="sell-site">
    <StoreHeader user={user} />
    <section className="product-detail">
      <div><Link href="/#products" className="back-link">← กลับไปสินค้าทั้งหมด</Link><ProductGallery images={product.images} name={product.name} category={product.category} /></div>
      <article className="product-detail-info"><span className="eyebrow">{product.category}</span><h1>{product.name}</h1>{product.featured && <span className="detail-badge">ไอดีแนะนำ</span>}<strong className="detail-price">฿{product.price.toLocaleString("th-TH")}</strong><p>{product.description}</p><div className="detail-stock"><span>สถานะไอดี</span><b className={product.stock ? "stock-ok" : "stock-out"}>{product.stock ? `มีไอดี ${product.stock} ชิ้น` : "สินค้าหมด"}</b></div><a href="#contact" className="button button-dark">สอบถามไอดีนี้</a></article>
    </section>
    <ContactSection settings={settings} />
    <footer><Link href="/" className="brand brand-light"><span>S</span> SELL ID</Link><p>© 2026 Sell ID. Game account store.</p></footer>
  </main>;
}
