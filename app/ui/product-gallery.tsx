"use client";

import { useEffect, useState } from "react";

export function ProductGallery({ images, name, category }: { images: string[]; name: string; category: string }) {
  const [selected, setSelected] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
      if (event.key === "ArrowLeft") setSelected((current) => (current - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") setSelected((current) => (current + 1) % images.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [expanded, images.length]);

  const showPrevious = () => setSelected((current) => (current - 1 + images.length) % images.length);
  const showNext = () => setSelected((current) => (current + 1) % images.length);

  if (!images.length) return <div className="product-detail-placeholder"><span>{category}</span></div>;
  return <div className="product-gallery">
    <button type="button" className="product-gallery-main" onClick={() => setExpanded(true)} aria-label={`ขยาย ${name} รูปที่ ${selected + 1}`}>
      <img src={images[selected]} alt={`${name} รูปที่ ${selected + 1}`} />
      <span>กดเพื่อขยายรูป</span>
    </button>
    {images.length > 1 && <div className="product-thumbnails" aria-label="เลือกรูปสินค้า">{images.map((image, index) => <button type="button" key={`${image}-${index}`} className={index === selected ? "active" : ""} onClick={() => setSelected(index)} aria-label={`ดูรูปที่ ${index + 1}`}><img src={image} alt="" /></button>)}</div>}
    {expanded && <div className="image-lightbox" role="dialog" aria-modal="true" aria-label={`${name} รูปขยาย`} onClick={() => setExpanded(false)}>
      <button type="button" className="image-lightbox-close" onClick={() => setExpanded(false)} aria-label="ปิดรูปขยาย">×</button>
      {images.length > 1 && <>
        <button type="button" className="image-lightbox-nav image-lightbox-previous" onClick={(event) => { event.stopPropagation(); showPrevious(); }} aria-label="ดูรูปก่อนหน้า">‹</button>
        <button type="button" className="image-lightbox-nav image-lightbox-next" onClick={(event) => { event.stopPropagation(); showNext(); }} aria-label="ดูรูปถัดไป">›</button>
      </>}
      <div onClick={(event) => event.stopPropagation()}>
        <img src={images[selected]} alt={`${name} รูปที่ ${selected + 1} ขนาดใหญ่`} />
        <small aria-live="polite">รูปที่ {selected + 1} จาก {images.length}</small>
      </div>
    </div>}
  </div>;
}
