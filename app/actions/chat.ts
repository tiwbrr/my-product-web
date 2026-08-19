"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { addChatMessage } from "@/lib/store";

export type ChatState = { error: string; sentAt?: string };

export async function sendChatMessageAction(
  _state: ChatState,
  formData: FormData,
): Promise<ChatState> {
  const user = await requireUser();
  const rawMessage = formData.get("message");
  const message = typeof rawMessage === "string" ? rawMessage.trim() : "";

  if (!message) return { error: "กรุณาพิมพ์ข้อความก่อนส่ง" };
  if (message.length > 1000) return { error: "ข้อความต้องไม่เกิน 1,000 ตัวอักษร" };

  try {
    const createdAt = new Date().toISOString();
    await addChatMessage({ id: randomUUID(), userId: user.id, message, createdAt });
    revalidatePath("/");
    return { error: "", sentAt: createdAt };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "ส่งข้อความไม่สำเร็จ กรุณาลองใหม่" };
  }
}
