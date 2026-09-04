"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { addGameCharacter, getGameCategory, removeGameCharacter } from "@/lib/store";

export type GameCharacterState = { error: string; success?: string };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function addGameCharacterAction(
  _state: GameCharacterState,
  formData: FormData,
): Promise<GameCharacterState> {
  await requireStaff();
  const name = text(formData, "name");
  const categoryId = text(formData, "categoryId");
  const rawSortOrder = Number(text(formData, "sortOrder"));
  if (name.length < 1 || name.length > 80) return { error: "ชื่อตัวละครต้องมี 1–80 ตัวอักษร" };
  const category = await getGameCategory(categoryId);
  if (!category) return { error: "ไม่พบหมวดเกมที่เลือก" };

  try {
    const now = new Date().toISOString();
    await addGameCharacter({
      id: randomUUID(),
      name,
      categoryId,
      categoryName: category.name,
      sortOrder: Number.isFinite(rawSortOrder) ? Math.trunc(rawSortOrder) : Date.now(),
      createdAt: now,
      updatedAt: now,
    });
    revalidatePath("/");
    revalidatePath("/admin");
    return { error: "", success: `เพิ่มตัวละคร ${name} แล้ว` };
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_GAME_CHARACTER") {
      return { error: `มีตัวละคร ${name} ในหมวด ${category.name} แล้ว` };
    }
    return { error: error instanceof Error ? error.message : "เพิ่มตัวละครไม่สำเร็จ" };
  }
}

export async function deleteGameCharacterAction(formData: FormData) {
  await requireStaff();
  const id = text(formData, "id");
  if (!id) return;
  await removeGameCharacter(id);
  revalidatePath("/");
  revalidatePath("/admin");
}
