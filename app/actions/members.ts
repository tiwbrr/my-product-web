"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getUserById, removeUser, updateUserRole } from "@/lib/store";

export type MemberActionState = { error: string; success?: string };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateMemberRoleAction(
  _state: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const admin = await requireAdmin();
  const id = text(formData, "id");
  const role = text(formData, "role");
  if (role !== "user" && role !== "manager") return { error: "สิทธิ์ที่เลือกไม่ถูกต้อง" };
  if (!id || id === admin.id) return { error: "ไม่สามารถเปลี่ยนสิทธิ์บัญชีของตัวเองได้" };

  const target = await getUserById(id);
  if (!target) return { error: "ไม่พบบัญชีที่ต้องการแก้ไข" };
  if (target.role === "admin") return { error: "ไม่สามารถเปลี่ยนสิทธิ์บัญชีแอดมินได้" };

  try {
    await updateUserRole(id, role);
    revalidatePath("/admin");
    return { error: "", success: `เปลี่ยนสิทธิ์ของ ${target.name} เรียบร้อยแล้ว` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "เปลี่ยนสิทธิ์ไม่สำเร็จ" };
  }
}

export async function deleteMemberAction(
  _state: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const admin = await requireAdmin();
  const id = text(formData, "id");
  if (!id || id === admin.id) return { error: "ไม่สามารถลบบัญชีของตัวเองได้" };

  const target = await getUserById(id);
  if (!target) return { error: "ไม่พบบัญชีที่ต้องการลบ" };
  if (target.role === "admin") return { error: "ไม่สามารถลบบัญชีแอดมินได้" };

  try {
    await removeUser(id);
    revalidatePath("/admin");
    return { error: "", success: `ลบบัญชี ${target.name} เรียบร้อยแล้ว` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "ลบบัญชีไม่สำเร็จ" };
  }
}
