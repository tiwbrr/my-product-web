"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MAX_CATALOG_PRICE } from "@/lib/product-constraints";
import type { AccountGender, GameCategory, Product } from "@/lib/types";

type GenderFilter = "all" | Exclude<AccountGender, "unspecified">;

function priceBoundary(value: string) {
  if (value === "") return "";
  return String(Math.min(MAX_CATALOG_PRICE, Math.max(0, Number(value))));
}

export function ProductCatalog({ products, categories }: { products: Product[]; categories: GameCategory[] }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [gender, setGender] = useState<GenderFilter>("all");
  const [minimumPrice, setMinimumPrice] = useState("0");
  const [maximumPrice, setMaximumPrice] = useState(String(MAX_CATALOG_PRICE));

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const minimum = minimumPrice === "" ? 0 : Number(minimumPrice);
    const maximum = maximumPrice === "" ? MAX_CATALOG_PRICE : Number(maximumPrice);
    const result = products.filter((product) =>
      (selectedCategory === "all" || product.category === selectedCategory)
      && (gender === "all" || product.accountGender === gender)
      && product.price >= minimum
      && product.price <= maximum
      && (!normalizedQuery || `${product.name} ${product.description}`.toLowerCase().includes(normalizedQuery))
    );
    return [...result].sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : b.createdAt.localeCompare(a.createdAt));
  }, [gender, maximumPrice, minimumPrice, products, query, selectedCategory, sort]);

  return <>
    <section className="game-categories" id="categories">
      <div className="sell-section-heading"><span>เลือกเกมที่ต้องการ</span><h2>หมวดหมู่เกม</h2></div>
      <div className="round-category-list">
        <button className={selectedCategory === "all" ? "active" : ""} onClick={() => setSelectedCategory("all")}><i className="category-all">ALL</i><b>ทั้งหมด</b></button>
        {categories.map((category) => <button className={selectedCategory === category.name ? "active" : ""} onClick={() => setSelectedCategory(category.name)} key={category.id}>{category.icon ? <img src={category.icon} alt="" /> : <i>{category.name.charAt(0).toUpperCase()}</i>}<b>{category.name}</b></button>)}
      </div>
    </section>
    <section className="sell-products" id="products">
      <div className="sell-section-heading"><span>AVAILABLE ACCOUNTS</span><h2>{selectedCategory === "all" ? "ไอดีเกมทั้งหมด" : selectedCategory}</h2><p>{filteredProducts.length} รายการ</p></div>
      <div className="catalog-filters">
        <div className="gender-filter" aria-label="กรองประเภทไอดี">
          <button className={gender === "all" ? "active" : ""} onClick={() => setGender("all")}>ทุกไอดี</button>
          <button className={gender === "male" ? "active" : ""} onClick={() => setGender("male")}>หลักชาย</button>
          <button className={gender === "female" ? "active" : ""} onClick={() => setGender("female")}>หลักหญิง</button>
        </div>
        <div className="price-filter">
          <span>ช่วงราคา</span>
          <label><small>ต่ำสุด</small><input type="number" min="0" max={MAX_CATALOG_PRICE} step="1" value={minimumPrice} onChange={(event) => setMinimumPrice(priceBoundary(event.target.value))} /></label>
          <b>–</b>
          <label><small>สูงสุด</small><input type="number" min="0" max={MAX_CATALOG_PRICE} step="1" value={maximumPrice} onChange={(event) => setMaximumPrice(priceBoundary(event.target.value))} /></label>
          <small>บาท (0–1,000,000)</small>
        </div>
      </div>
      <div className="catalog-tools">
        <label><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาไอดีเกม..." /></label>
        <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="เรียงสินค้า"><option value="newest">ล่าสุด</option><option value="low">ราคาน้อยไปมาก</option><option value="high">ราคามากไปน้อย</option></select>
      </div>
      {filteredProducts.length ? <div className="sell-product-grid">{filteredProducts.map((product) => <Link href={`/products/${product.id}`} className="sell-product-card" key={product.id}><div className="sell-product-image">{product.images[0] ? <img src={product.images[0]} alt={product.name} /> : <span><b>{product.category.charAt(0)}</b><small>รอใส่รูปไอดี</small></span>}{product.featured && <em>แนะนำ</em>}</div><div className="sell-product-copy"><small>{product.category} · {product.accountGender === "male" ? "หลักชาย" : product.accountGender === "female" ? "หลักหญิง" : "ยังไม่ระบุ"}</small><h3>{product.name}</h3><div><span className={product.stock ? "available" : "sold-out"}>{product.stock ? `มีไอดีอยู่ ${product.stock} ชิ้น` : "สินค้าหมด"}</span><strong>฿{product.price.toLocaleString("th-TH")}</strong></div></div></Link>)}</div> : <div className="sell-empty"><span>⌕</span><h3>ไม่พบไอดีเกมตามตัวกรองนี้</h3><p>ลองเปลี่ยนประเภทไอดี ช่วงราคา หมวดเกม หรือคำค้นหา</p></div>}
    </section>
  </>;
}
