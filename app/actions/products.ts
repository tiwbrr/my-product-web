"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getProduct, removeProduct, saveProduct } from "@/lib/store";
import { removeImage, uploadImage } from "@/lib/storage";
import type { Product } from "@/lib/types";

export type ProductState = { error: string; success?: string };
const maximumImages = 8;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function saveProductAction(
  _state: ProductState,
  formData: FormData,
): Promise<ProductState> {
  await requireAdmin();
  const id = text(formData, "id");
  const existing = id ? await getProduct(id) : null;
  if (id && !existing) return { error: "ไม่พบสินค้าที่ต้องการแก้ไข" };

  const name = text(formData, "name");
  const category = text(formData, "category");
  const description = text(formData, "description");
  const price = Number(text(formData, "price"));
  const stock = Number(text(formData, "stock"));
  if (name.length < 2 || !category || description.length < 10) {
    return { error: "กรุณากรอกชื่อ หมวดหมู่ และรายละเอียดสินค้าให้ครบ" };
  }
  if (!Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
    return { error: "ราคาและจำนวนสินค้าต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป" };
  }

  const removedImages = new Set(
    formData.getAll("removeImages").filter((value): value is string => typeof value === "string"),
  );
  const retainedImages = (existing?.images ?? []).filter((image) => !removedImages.has(image));
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
  if (retainedImages.length + files.length > maximumImages) {
    return { error: `สินค้าใส่รูปได้สูงสุด ${maximumImages} รูป` };
  }

  const uploadedImages: string[] = [];
  try {
    for (const file of files) uploadedImages.push(await uploadImage(file, "products"));
    const now = new Date().toISOString();
    const product: Product = {
      id: existing?.id ?? randomUUID(),
      name,
      category,
      description,
      price,
      stock,
      images: [...retainedImages, ...uploadedImages],
      featured: formData.get("featured") === "on",
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await saveProduct(product);
    await Promise.all([...removedImages].map(removeImage));
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath(`/products/${product.id}`);
    return { error: "", success: existing ? "บันทึกการแก้ไขแล้ว" : "เพิ่มสินค้าเรียบร้อยแล้ว" };
  } catch (error) {
    await Promise.allSettled(uploadedImages.map(removeImage));
    return { error: error instanceof Error ? error.message : "บันทึกสินค้าไม่สำเร็จ" };
  }
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const product = await removeProduct(id);
  if (product) await Promise.allSettled(product.images.map(removeImage));
  revalidatePath("/");
  revalidatePath("/admin");
}
