"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { addGameCategory, getGameCategory, removeGameCategory, updateGameCategoryIcon } from "@/lib/store";
import { removeImage, uploadImage } from "@/lib/storage";

export type CategoryState = { error: string; success?: string };

export async function addGameCategoryAction(
  _state: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  await requireStaff();
  const nameValue = formData.get("name");
  const name = typeof nameValue === "string" ? nameValue.trim() : "";
  if (name.length < 2) return { error: "กรุณาใส่ชื่อเกมอย่างน้อย 2 ตัวอักษร" };
  const file = formData.get("icon");
  let icon = "";
  try {
    if (file instanceof File && file.size > 0) icon = await uploadImage(file, "categories");
    await addGameCategory({ id: randomUUID(), name, icon, sortOrder: Date.now() });
    revalidatePath("/");
    revalidatePath("/admin");
    return { error: "", success: `เพิ่มหมวด ${name} แล้ว` };
  } catch (error) {
    if (icon) await removeImage(icon).catch(() => undefined);
    if (error instanceof Error && error.message === "DUPLICATE_CATEGORY") return { error: "มีหมวดเกมชื่อนี้แล้ว" };
    return { error: error instanceof Error ? error.message : "เพิ่มหมวดเกมไม่สำเร็จ" };
  }
}

export async function deleteGameCategoryAction(formData: FormData) {
  await requireStaff();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const category = await removeGameCategory(id);
  if (category?.icon) await removeImage(category.icon);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateGameCategoryIconAction(formData: FormData) {
  await requireStaff();
  const id = formData.get("id");
  const file = formData.get("icon");
  if (typeof id !== "string" || !(file instanceof File) || file.size === 0) return;
  const category = await getGameCategory(id);
  if (!category) return;
  const nextIcon = await uploadImage(file, "categories");
  try {
    await updateGameCategoryIcon(id, nextIcon);
    if (category.icon) await removeImage(category.icon);
    revalidatePath("/");
    revalidatePath("/admin");
  } catch (error) {
    await removeImage(nextIcon).catch(() => undefined);
    throw error;
  }
}
