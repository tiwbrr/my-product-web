"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveProductAction, type ProductState } from "@/app/actions/products";
import { MAX_IMAGE_SIZE_BYTES, MAX_PRODUCT_IMAGES } from "@/lib/product-constraints";
import type { GameCategory, Product } from "@/lib/types";

const initialState: ProductState = { error: "" };

export function ProductForm({ product, categories, compact = false }: { product?: Product; categories: GameCategory[]; compact?: boolean }) {
  const [state, formAction, pending] = useActionState(saveProductAction, initialState);
  const [fileError, setFileError] = useState("");
  const [selectedFileCount, setSelectedFileCount] = useState(0);
  const [removedImageCount, setRemovedImageCount] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.success && !product) formRef.current?.reset(); }, [state.success, product]);

  const availableImageSlots = MAX_PRODUCT_IMAGES - (product?.images.length ?? 0) + removedImageCount;

  function validateImages(input: HTMLInputElement) {
    const files = Array.from(input.files ?? []);
    let error = "";
    if (files.length > availableImageSlots) {
      error = `เลือกเพิ่มได้ไม่เกิน ${availableImageSlots} รูป (รวมทั้งหมดสูงสุด ${MAX_PRODUCT_IMAGES} รูป)`;
    } else if (files.some((file) => file.size > MAX_IMAGE_SIZE_BYTES)) {
      error = "รูปภาพแต่ละรูปต้องมีขนาดไม่เกิน 20 MB";
    }
    input.setCustomValidity(error);
    setFileError(error);
    setSelectedFileCount(error ? 0 : files.length);
    if (error) {
      input.value = "";
      input.reportValidity();
      input.setCustomValidity("");
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className={`product-form ${compact ? "product-form-compact" : ""}`}
      onReset={() => { setFileError(""); setSelectedFileCount(0); setRemovedImageCount(0); }}
    >
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="field-row">
        <label>ชื่อไอดีหรือสินค้า<input name="name" defaultValue={product?.name} placeholder="เช่น ไอดีเริ่มต้น มีตัวละคร 5 ดาว" required /></label>
        <label>หมวดเกม<select name="category" defaultValue={product?.category ?? categories[0]?.name ?? ""} required>{product?.category && !categories.some((category) => category.name === product.category) && <option value={product.category}>{product.category}</option>}{categories.map((category) => <option value={category.name} key={category.id}>{category.name}</option>)}</select></label>
      </div>
      <label>รายละเอียดไอดีเกม<textarea name="description" defaultValue={product?.description} placeholder="บอกตัวละคร อาวุธ เพชร เซิร์ฟเวอร์ หรือข้อมูลสำคัญของไอดี" rows={compact ? 3 : 4} required minLength={10} /></label>
      <div className="field-row">
        <label>ราคา (บาท)<input name="price" type="number" min="0" step="0.01" defaultValue={product?.price} placeholder="0" required /></label>
        <label>จำนวนคงเหลือ<input name="stock" type="number" min="1" step="1" defaultValue={product?.stock || 1} required /><small className="field-help">ต้องมีอย่างน้อย 1 ชิ้น</small></label>
      </div>
      <label>ประเภทไอดี
        <select name="accountGender" defaultValue={product?.accountGender === "unspecified" ? "" : product?.accountGender ?? ""} required>
          <option value="" disabled>เลือกหลักชายหรือหลักหญิง</option>
          <option value="male">ไอดีหลักชาย</option>
          <option value="female">ไอดีหลักหญิง</option>
        </select>
      </label>
      {product?.images.length ? <div className="current-images"><b>รูปปัจจุบัน</b><div>{product.images.map((image, index) => <label key={image}><img src={image} alt={`${product.name} รูปที่ ${index + 1}`} /><span><input name="removeImages" type="checkbox" value={image} onChange={(event) => setRemovedImageCount((count) => count + (event.target.checked ? 1 : -1))} /> ลบรูปนี้</span></label>)}</div></div> : null}
      <label className="file-field">
        <span>รูปสินค้า <small>เลือกพร้อมกันได้ · รวมสูงสุด 30 รูป · รูปละไม่เกิน 20 MB</small></span>
        <input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => validateImages(event.currentTarget)} />
        <i>{selectedFileCount ? `เลือกแล้ว ${selectedFileCount} รูป` : product?.images.length ? `เพิ่มได้อีก ${availableImageSlots} รูป (รูปใหม่จะต่อจากรูปเดิม)` : "เลือกรูปจากเครื่องพร้อมกันได้สูงสุด 30 รูป"}</i>
      </label>
      <label className="checkbox-field"><input name="featured" type="checkbox" defaultChecked={product?.featured} /> แสดงป้ายสินค้าแนะนำ</label>
      {fileError && <p className="form-error" role="alert">{fileError}</p>}
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.success && <p className="form-success" role="status">{state.success}</p>}
      <button className="button button-dark button-wide" disabled={pending}>{pending ? "กำลังบันทึก..." : product ? "บันทึกการแก้ไข" : "+ เพิ่มไอดีเข้าร้าน"}</button>
    </form>
  );
}
