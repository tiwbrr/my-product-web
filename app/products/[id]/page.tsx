import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactSection } from "@/app/ui/contact-section";
import { ProductGallery } from "@/app/ui/product-gallery";
import { PaginatedList } from "@/app/ui/paginated-list";
import { ProductCard } from "@/app/ui/product-card";
import { StoreHeader } from "@/app/ui/store-header";
import { getCurrentUser } from "@/lib/auth";
import { catalogFiltersToSearchParams, filterCatalogProducts, hasCatalogContext, parseCatalogFilters, type CatalogSearchParams } from "@/lib/catalog-filters";
import { getGameCharacters, getProducts, getStoreSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<CatalogSearchParams> }) {
  const { id } = await params;
  const rawSearchParams = await searchParams;
  const filters = parseCatalogFilters(rawSearchParams);
  const [products, user, settings, characters] = await Promise.all([
    getProducts(),
    getCurrentUser(),
    getStoreSettings(),
    getGameCharacters(),
  ]);
  const product = products.find((item) => item.id === id);
  if (!product) notFound();
  const productCharacters = characters.filter((character) => product.characterIds.includes(character.id));
  const serializedFilters = catalogFiltersToSearchParams(filters);
  const otherProducts = filterCatalogProducts(products, filters).filter((item) => item.id !== product.id);
  const backHref = `/${serializedFilters ? `?${serializedFilters}` : ""}#products`;
  return <main className="sell-site">
    <StoreHeader user={user} />
    <section className="product-detail">
      <div><Link href={backHref} className="back-link">← กลับไปผลการค้นหา</Link><ProductGallery images={product.images} name={product.name} category={product.category} /></div>
      <article className="product-detail-info"><span className="eyebrow">{product.category}</span><h1>{product.name}</h1>{product.featured && <span className="detail-badge">ไอดีแนะนำ</span>}<span className="account-gender-badge">{product.accountGender === "male" ? "ไอดีหลักชาย" : product.accountGender === "female" ? "ไอดีหลักหญิง" : "ยังไม่ระบุประเภทไอดี"}</span>{productCharacters.length > 0 && <div className="detail-characters"><span>ตัวละครในไอดี</span><div>{productCharacters.map((character) => <b key={character.id}>{character.name}</b>)}</div></div>}<strong className="detail-price">฿{product.price.toLocaleString("th-TH")}</strong><p>{product.description}</p><div className="detail-stock"><span>สถานะไอดี</span><b className={product.stock ? "stock-ok" : "stock-out"}>{product.stock ? `มีไอดี ${product.stock} ชิ้น` : "สินค้าหมด"}</b></div><a href="#contact" className="button button-dark">สอบถามไอดีนี้</a></article>
    </section>
    {otherProducts.length > 0 && <section className="related-products">
      <div className="sell-section-heading">
        <span>{hasCatalogContext(rawSearchParams) ? "YOUR SEARCH RESULTS" : "MORE ACCOUNTS"}</span>
        <h2>{hasCatalogContext(rawSearchParams) ? "ไอดีอื่น ๆ จากผลการค้นหานี้" : "ไอดีอื่น ๆ ที่คุณอาจสนใจ"}</h2>
        <p>{otherProducts.length} รายการ</p>
      </div>
      <PaginatedList listClassName="sell-product-grid" itemLabel="รายการสินค้า">{otherProducts.map((item) => <ProductCard product={item} searchParams={serializedFilters} key={item.id} />)}</PaginatedList>
    </section>}
    <ContactSection settings={settings} />
    <footer><Link href="/" className="brand brand-light"><span>K</span> KUOZO SHOP</Link><p>© 2026 Kuozo Shop. Game account store.</p></footer>
  </main>;
}
