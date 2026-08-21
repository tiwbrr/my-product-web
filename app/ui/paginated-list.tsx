"use client";

import { Children, type ReactNode, useRef, useState } from "react";

type PageSize = 10 | 50 | 100;

export function PaginatedList({ children, listClassName, itemLabel = "รายการ" }: {
  children: ReactNode;
  listClassName: string;
  itemLabel?: string;
}) {
  const items = Children.toArray(children);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [page, setPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const firstItem = (currentPage - 1) * pageSize;
  const visibleItems = items.slice(firstItem, firstItem + pageSize);

  const goToPage = (nextPage: number) => {
    setPage(Math.min(pageCount, Math.max(1, nextPage)));
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return <div className="paginated-list" ref={containerRef}>
    <div className="paginated-list-controls">
      <span>แสดง {items.length ? firstItem + 1 : 0}–{Math.min(firstItem + pageSize, items.length)} จาก {items.length} {itemLabel}</span>
      <label>แสดง<select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value) as PageSize); setPage(1); }} aria-label={`จำนวน${itemLabel}ต่อหน้า`}><option value="10">10 รายการ</option><option value="50">50 รายการ</option><option value="100">100 รายการ</option></select></label>
    </div>
    <div className={listClassName}>{visibleItems}</div>
    {pageCount > 1 && <nav className="catalog-pagination" aria-label={`เปลี่ยนหน้า${itemLabel}`}>
      <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>← ก่อนหน้า</button>
      <span aria-live="polite">หน้า <b>{currentPage}</b> จาก {pageCount}</span>
      <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pageCount}>ถัดไป →</button>
    </nav>}
  </div>;
}
