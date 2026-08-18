"use client";

import { useState } from "react";

export function ProductGallery({ images, name, category }: { images: string[]; name: string; category: string }) {
  const [selected, setSelected] = useState(0);
  if (!images.length) return <div className="product-detail-placeholder"><span>{category}</span></div>;
  return <div className="product-gallery">
    <div className="product-gallery-main"><img src={images[selected]} alt={`${name} รูปที่ ${selected + 1}`} /></div>
    {images.length > 1 && <div className="product-thumbnails" aria-label="เลือกรูปสินค้า">{images.map((image, index) => <button key={image} className={index === selected ? "active" : ""} onClick={() => setSelected(index)} aria-label={`ดูรูปที่ ${index + 1}`}><img src={image} alt="" /></button>)}</div>}
  </div>;
}
