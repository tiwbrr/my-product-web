"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { GameCategory, Product } from "@/lib/types";

export function ProductCatalog({ products, categories }: { products: Product[]; categories: GameCategory[] }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = products.filter((product) =>
      (selectedCategory === "all" || product.category === selectedCategory)
      && (!normalizedQuery || `${product.name} ${product.description}`.toLowerCase().includes(normalizedQuery))
    );
    return [...result].sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : b.createdAt.localeCompare(a.createdAt));
  }, [products, query, selectedCategory, sort]);
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
      <div className="catalog-tools"><label><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาไอดีเกม..." /></label><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="เรียงสินค้า"><option value="newest">ล่าสุด</option><option value="low">ราคาน้อยไปมาก</option><option value="high">ราคามากไปน้อย</option></select></div>
      {filteredProducts.length ? <div className="sell-product-grid">{filteredProducts.map((product) => <Link href={`/products/${product.id}`} className="sell-product-card" key={product.id}><div className="sell-product-image">{product.images[0] ? <img src={product.images[0]} alt={product.name} /> : <span><b>{product.category.charAt(0)}</b><small>รอใส่รูปไอดี</small></span>}{product.featured && <em>แนะนำ</em>}</div><div className="sell-product-copy"><small>{product.category}</small><h3>{product.name}</h3><div><span className={product.stock ? "available" : "sold-out"}>{product.stock ? `มีไอดีอยู่ ${product.stock} ชิ้น` : "สินค้าหมด"}</span><strong>฿{product.price.toLocaleString("th-TH")}</strong></div></div></Link>)}</div> : <div className="sell-empty"><span>⌕</span><h3>ไม่พบไอดีเกมในหมวดนี้</h3><p>ลองเลือกหมวดอื่นหรือเปลี่ยนคำค้นหา</p></div>}
    </section>
  </>;
}
