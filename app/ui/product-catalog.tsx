"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ProductCard } from "@/app/ui/product-card";
import { catalogFiltersToSearchParams, filterCatalogProducts, type CatalogFilters, type CatalogGender, type CatalogSort } from "@/lib/catalog-filters";
import { MAX_CATALOG_PRICE } from "@/lib/product-constraints";
import type { GameCategory, Product } from "@/lib/types";

type PageSize = 10 | 50 | 100;

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
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [page, setPage] = useState(1);

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
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetPage = () => setPage(1);
  const goToPage = (nextPage: number) => {
    setPage(Math.min(pageCount, Math.max(1, nextPage)));
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return <>
    <section className="game-categories" id="categories">
      <div className="sell-section-heading"><span>เลือกเกมที่ต้องการ</span><h2>หมวดหมู่เกม</h2></div>
      <div className="round-category-list">
        <button className={selectedCategory === "all" ? "active" : ""} onClick={() => { setSelectedCategory("all"); resetPage(); }}><i className="category-all">ALL</i><b>ทั้งหมด</b></button>
        {categories.map((category) => <button className={selectedCategory === category.name ? "active" : ""} onClick={() => { setSelectedCategory(category.name); resetPage(); }} key={category.id}>{category.icon ? <Image src={category.icon} width={88} height={88} sizes="88px" alt="" /> : <i>{category.name.charAt(0).toUpperCase()}</i>}<b>{category.name}</b></button>)}
      </div>
    </section>
    <section className="sell-products" id="products">
      <div className="sell-section-heading"><span>AVAILABLE ACCOUNTS</span><h2>{selectedCategory === "all" ? "ไอดีเกมทั้งหมด" : selectedCategory}</h2><p>{filteredProducts.length} รายการ</p></div>
      <div className="catalog-filters">
        <div className="gender-filter" aria-label="กรองประเภทไอดี">
          <button className={gender === "all" ? "active" : ""} onClick={() => { setGender("all"); resetPage(); }}>ทุกไอดี</button>
          <button className={gender === "male" ? "active" : ""} onClick={() => { setGender("male"); resetPage(); }}>หลักชาย</button>
          <button className={gender === "female" ? "active" : ""} onClick={() => { setGender("female"); resetPage(); }}>หลักหญิง</button>
        </div>
        <div className="price-filter">
          <span>ช่วงราคา</span>
          <label><small>ต่ำสุด</small><input type="number" min="0" max={MAX_CATALOG_PRICE} step="1" value={minimumPrice} onChange={(event) => { setMinimumPrice(priceBoundary(event.target.value)); resetPage(); }} /></label>
          <b>–</b>
          <label><small>สูงสุด</small><input type="number" min="0" max={MAX_CATALOG_PRICE} step="1" value={maximumPrice} onChange={(event) => { setMaximumPrice(priceBoundary(event.target.value)); resetPage(); }} /></label>
          <small>บาท (0–1,000,000)</small>
        </div>
      </div>
      <div className="catalog-tools">
        <label><span>⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); resetPage(); }} placeholder="ค้นหาไอดีเกม..." /></label>
        <select value={sort} onChange={(event) => { setSort(event.target.value as CatalogSort); resetPage(); }} aria-label="เรียงสินค้า"><option value="newest">ล่าสุด</option><option value="low">ราคาน้อยไปมาก</option><option value="high">ราคามากไปน้อย</option></select>
        <label className="page-size-control"><span>แสดง</span><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value) as PageSize); resetPage(); }} aria-label="จำนวนสินค้าต่อหน้า"><option value="10">10 รายการ</option><option value="50">50 รายการ</option><option value="100">100 รายการ</option></select></label>
      </div>
      {filteredProducts.length ? <>
        <div className="catalog-page-summary">แสดง {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredProducts.length)} จาก {filteredProducts.length} รายการ</div>
        <div className="sell-product-grid">{visibleProducts.map((product) => <ProductCard product={product} searchParams={productSearchParams} key={product.id} />)}</div>
        {pageCount > 1 && <nav className="catalog-pagination" aria-label="เปลี่ยนหน้ารายการสินค้า">
          <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>← ก่อนหน้า</button>
          <span aria-live="polite">หน้า <b>{currentPage}</b> จาก {pageCount}</span>
          <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pageCount}>ถัดไป →</button>
        </nav>}
      </> : <div className="sell-empty"><span>⌕</span><h3>ไม่พบไอดีเกมตามตัวกรองนี้</h3><p>ลองเปลี่ยนประเภทไอดี ช่วงราคา หมวดเกม หรือคำค้นหา</p></div>}
    </section>
  </>;
}
