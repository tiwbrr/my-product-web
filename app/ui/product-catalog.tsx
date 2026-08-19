"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/app/ui/product-card";
import { catalogFiltersToSearchParams, filterCatalogProducts, type CatalogFilters, type CatalogGender, type CatalogSort } from "@/lib/catalog-filters";
import { MAX_CATALOG_PRICE } from "@/lib/product-constraints";
import type { GameCategory, Product } from "@/lib/types";

function priceBoundary(value: string) {
  if (value === "") return "";
  return String(Math.min(MAX_CATALOG_PRICE, Math.max(0, Number(value))));
}

export function ProductCatalog({ products, categories, initialFilters }: { products: Product[]; categories: GameCategory[]; initialFilters: CatalogFilters }) {
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category);
  const [query, setQuery] = useState(initialFilters.query);
  const [sort, setSort] = useState<CatalogSort>(initialFilters.sort);
  const [gender, setGender] = useState<CatalogGender>(initialFilters.gender);
  const [minimumPrice, setMinimumPrice] = useState(initialFilters.minimumPrice);
  const [maximumPrice, setMaximumPrice] = useState(initialFilters.maximumPrice);

  const activeFilters = useMemo<CatalogFilters>(() => ({
    category: selectedCategory,
    query,
    sort,
    gender,
    minimumPrice,
    maximumPrice,
  }), [gender, maximumPrice, minimumPrice, query, selectedCategory, sort]);

  const filteredProducts = useMemo(() => filterCatalogProducts(products, activeFilters), [activeFilters, products]);
  const productSearchParams = useMemo(() => catalogFiltersToSearchParams(activeFilters), [activeFilters]);

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
        <select value={sort} onChange={(event) => setSort(event.target.value as CatalogSort)} aria-label="เรียงสินค้า"><option value="newest">ล่าสุด</option><option value="low">ราคาน้อยไปมาก</option><option value="high">ราคามากไปน้อย</option></select>
      </div>
      {filteredProducts.length ? <div className="sell-product-grid">{filteredProducts.map((product) => <ProductCard product={product} searchParams={productSearchParams} key={product.id} />)}</div> : <div className="sell-empty"><span>⌕</span><h3>ไม่พบไอดีเกมตามตัวกรองนี้</h3><p>ลองเปลี่ยนประเภทไอดี ช่วงราคา หมวดเกม หรือคำค้นหา</p></div>}
    </section>
  </>;
}
