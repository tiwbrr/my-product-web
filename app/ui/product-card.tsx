import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";

export function ProductCard({ product, searchParams = "" }: { product: Product; searchParams?: string }) {
  const href = `/products/${product.id}${searchParams ? `?${searchParams}` : ""}`;

  return <Link href={href} className="sell-product-card">
    <div className="sell-product-image">
      {product.images[0]
        ? <Image src={product.images[0]} alt={product.name} fill sizes="(max-width: 500px) 100vw, (max-width: 900px) 50vw, 25vw" />
        : <span><b>{product.category.charAt(0)}</b><small>รอใส่รูปไอดี</small></span>}
      {product.featured && <em>แนะนำ</em>}
    </div>
    <div className="sell-product-copy">
      <small>{product.category} · {product.accountGender === "male" ? "หลักชาย" : product.accountGender === "female" ? "หลักหญิง" : "ยังไม่ระบุ"}</small>
      <h3>{product.name}</h3>
      <div>
        <span className={product.stock ? "available" : "sold-out"}>{product.stock ? `มีไอดีอยู่ ${product.stock} ชิ้น` : "สินค้าหมด"}</span>
        <strong>฿{product.price.toLocaleString("th-TH")}</strong>
      </div>
    </div>
  </Link>;
}
