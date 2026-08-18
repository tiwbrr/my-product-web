"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveProductAction, type ProductState } from "@/app/actions/products";
import type { GameCategory, Product } from "@/lib/types";

const initialState: ProductState = { error: "" };

export function ProductForm({ product, categories, compact = false }: { product?: Product; categories: GameCategory[]; compact?: boolean }) {
  const [state, formAction, pending] = useActionState(saveProductAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.success && !product) formRef.current?.reset(); }, [state.success, product]);
  return (
    <form ref={formRef} action={formAction} className={`product-form ${compact ? "product-form-compact" : ""}`}>
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="field-row"><label>ชื่อไอดีหรือสินค้า<input name="name" defaultValue={product?.name} placeholder="เช่น ไอดีเริ่มต้น มีตัวละคร 5 ดาว" required /></label><label>หมวดเกม<select name="category" defaultValue={product?.category ?? categories[0]?.name ?? ""} required>{product?.category && !categories.some((category) => category.name === product.category) && <option value={product.category}>{product.category}</option>}{categories.map((category) => <option value={category.name} key={category.id}>{category.name}</option>)}</select></label></div>
      <label>รายละเอียดไอดีเกม<textarea name="description" defaultValue={product?.description} placeholder="บอกตัวละคร อาวุธ เพชร เซิร์ฟเวอร์ หรือข้อมูลสำคัญของไอดี" rows={compact ? 3 : 4} required minLength={10} /></label>
      <div className="field-row"><label>ราคา (บาท)<input name="price" type="number" min="0" step="0.01" defaultValue={product?.price} placeholder="0" required /></label><label>จำนวนคงเหลือ<input name="stock" type="number" min="0" step="1" defaultValue={product?.stock ?? 0} required /></label></div>
      {product?.images.length ? <div className="current-images"><b>รูปปัจจุบัน</b><div>{product.images.map((image, index) => <label key={image}><img src={image} alt={`${product.name} รูปที่ ${index + 1}`} /><span><input name="removeImages" type="checkbox" value={image} /> ลบรูปนี้</span></label>)}</div></div> : null}
      <label className="file-field"><span>รูปสินค้า <small>เลือกได้หลายรูป · สูงสุด 8 รูป · รูปละไม่เกิน 4 MB</small></span><input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple /><i>{product?.images.length ? "รูปใหม่จะถูกเพิ่มต่อจากรูปเดิม" : "เลือกรูปจากเครื่องได้พร้อมกันหลายรูป"}</i></label>
      <label className="checkbox-field"><input name="featured" type="checkbox" defaultChecked={product?.featured} /> แสดงป้ายสินค้าแนะนำ</label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}{state.success && <p className="form-success" role="status">{state.success}</p>}
      <button className="button button-dark button-wide" disabled={pending}>{pending ? "กำลังบันทึก..." : product ? "บันทึกการแก้ไข" : "+ เพิ่มไอดีเข้าร้าน"}</button>
    </form>
  );
}
