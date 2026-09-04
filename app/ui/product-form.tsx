"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveProductAction, type ProductState } from "@/app/actions/products";
import { MAX_IMAGE_SIZE_BYTES, MAX_PRODUCT_IMAGES } from "@/lib/product-constraints";
import type { GameCategory, GameCharacter, Product } from "@/lib/types";

const initialState: ProductState = { error: "" };
const MAX_IMAGE_EDGE = 2560;
const WEBP_QUALITY = 0.84;

async function optimizeImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_EDGE / bitmap.width, MAX_IMAGE_EDGE / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("ไม่สามารถประมวลผลรูปภาพได้");
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", WEBP_QUALITY));
  if (!blob) throw new Error("ไม่สามารถแปลงรูปภาพเป็น WebP ได้");
  const filename = `${file.name.replace(/\.[^.]+$/, "") || "product"}.webp`;
  return new File([blob], filename, { type: "image/webp", lastModified: file.lastModified });
}

export function ProductForm({ product, categories, characters, compact = false }: { product?: Product; categories: GameCategory[]; characters: GameCharacter[]; compact?: boolean }) {
  const [state, formAction, pending] = useActionState(saveProductAction, initialState);
  const [fileError, setFileError] = useState("");
  const [selectedFileCount, setSelectedFileCount] = useState(0);
  const [removedImageCount, setRemovedImageCount] = useState(0);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(product?.category ?? categories[0]?.name ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.success && !product) formRef.current?.reset(); }, [state.success, product]);

  const availableImageSlots = MAX_PRODUCT_IMAGES - (product?.images.length ?? 0) + removedImageCount;
  const availableCharacters = characters.filter((character) => character.categoryName === selectedCategory);

  async function validateImages(input: HTMLInputElement) {
    const files = Array.from(input.files ?? []);
    let error = "";
    if (files.length > availableImageSlots) {
      error = `เลือกเพิ่มได้ไม่เกิน ${availableImageSlots} รูป (รวมทั้งหมดสูงสุด ${MAX_PRODUCT_IMAGES} รูป)`;
    } else if (files.some((file) => file.size > MAX_IMAGE_SIZE_BYTES)) {
      error = "รูปภาพแต่ละรูปต้องมีขนาดไม่เกิน 20 MB";
    }
    input.setCustomValidity(error);
    setFileError(error);
    if (error) {
      setSelectedFileCount(0);
      input.value = "";
      input.reportValidity();
      input.setCustomValidity("");
      return;
    }

    setOptimizing(true);
    setSelectedFileCount(0);
    setOptimizationProgress(`กำลังย่อรูป 0/${files.length}`);
    try {
      const optimizedFiles: File[] = [];
      let originalBytes = 0;
      let optimizedBytes = 0;
      for (const [index, file] of files.entries()) {
        originalBytes += file.size;
        const optimized = await optimizeImage(file);
        if (optimized.size > MAX_IMAGE_SIZE_BYTES) throw new Error(`รูป ${file.name} ยังมีขนาดเกิน 20 MB หลังย่อ`);
        optimizedFiles.push(optimized);
        optimizedBytes += optimized.size;
        setOptimizationProgress(`กำลังย่อรูป ${index + 1}/${files.length}`);
      }
      const transfer = new DataTransfer();
      optimizedFiles.forEach((file) => transfer.items.add(file));
      input.files = transfer.files;
      setSelectedFileCount(optimizedFiles.length);
      setOptimizationProgress(`ย่อแล้ว ${optimizedFiles.length} รูป · ${(originalBytes / 1024 / 1024).toFixed(1)} MB เหลือ ${(optimizedBytes / 1024 / 1024).toFixed(1)} MB`);
    } catch (caught) {
      input.value = "";
      setFileError(caught instanceof Error ? caught.message : "ย่อรูปภาพไม่สำเร็จ กรุณาลองใหม่");
      setOptimizationProgress("");
    } finally {
      setOptimizing(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className={`product-form ${compact ? "product-form-compact" : ""}`}
      onSubmit={(event) => { if (optimizing) event.preventDefault(); }}
      onReset={() => { setFileError(""); setSelectedFileCount(0); setRemovedImageCount(0); setOptimizationProgress(""); setSelectedCategory(product?.category ?? categories[0]?.name ?? ""); }}
    >
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="field-row">
        <label>ชื่อไอดีหรือสินค้า<input name="name" defaultValue={product?.name} placeholder="เช่น ไอดีเริ่มต้น มีตัวละคร 5 ดาว" required /></label>
        <label>หมวดเกม<select name="category" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} required>{product?.category && !categories.some((category) => category.name === product.category) && <option value={product.category}>{product.category}</option>}{categories.map((category) => <option value={category.name} key={category.id}>{category.name}</option>)}</select></label>
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
      <fieldset className="product-character-picker">
        <legend>ตัวละครที่มีในไอดี <small>เลือกได้หลายตัว</small></legend>
        {availableCharacters.length ? <div>{availableCharacters.map((character) => <label key={character.id}><input name="characterIds" type="checkbox" value={character.id} defaultChecked={product?.characterIds.includes(character.id)} /><span>{character.name}</span></label>)}</div> : <p>ยังไม่มีตัวละครในหมวด {selectedCategory || "ที่เลือก"} กรุณาเพิ่มจากส่วน “รายชื่อตัวละคร” ก่อน</p>}
      </fieldset>
      {product?.images.length ? <div className="current-images"><b>รูปปัจจุบัน</b><div>{product.images.map((image, index) => <label key={image}><img src={image} alt={`${product.name} รูปที่ ${index + 1}`} /><span><input name="removeImages" type="checkbox" value={image} onChange={(event) => setRemovedImageCount((count) => count + (event.target.checked ? 1 : -1))} /> ลบรูปนี้</span></label>)}</div></div> : null}
      <label className="file-field">
        <span>รูปสินค้า <small>ต้นฉบับไม่เกิน 20 MB · ระบบย่อและแปลง WebP ให้อัตโนมัติ</small></span>
        <input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={optimizing} onChange={(event) => void validateImages(event.currentTarget)} />
        <i>{optimizationProgress || (selectedFileCount ? `พร้อมอัปโหลด ${selectedFileCount} รูป` : product?.images.length ? `เพิ่มได้อีก ${availableImageSlots} รูป (รวมสูงสุด 30 รูป)` : "เลือกพร้อมกันจากเครื่องได้สูงสุด 30 รูป")}</i>
      </label>
      <label className="checkbox-field"><input name="featured" type="checkbox" defaultChecked={product?.featured} /> แสดงป้ายสินค้าแนะนำ</label>
      {fileError && <p className="form-error" role="alert">{fileError}</p>}
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.success && <p className="form-success" role="status">{state.success}</p>}
      <button className="button button-dark button-wide" disabled={pending || optimizing}>{optimizing ? "กำลังย่อรูป..." : pending ? "กำลังบันทึก..." : product ? "บันทึกการแก้ไข" : "+ เพิ่มไอดีเข้าร้าน"}</button>
    </form>
  );
}
