"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { addChatMessage, getLatestChatMessageTime } from "@/lib/store";
import { sendChatPushNotifications } from "@/lib/push";

export type ChatState = { error: string; sentAt?: string };

export async function sendChatMessageAction(
  _state: ChatState,
  formData: FormData,
): Promise<ChatState> {
  const user = await requireUser();
  const rawMessage = formData.get("message");
  const message = typeof rawMessage === "string" ? rawMessage.trim() : "";

  if (!message) return { error: "กรุณาพิมพ์ข้อความก่อนส่ง" };
  if (message.length > 300) return { error: "ข้อความต้องไม่เกิน 300 ตัวอักษร" };

  try {
    const latestMessageTime = await getLatestChatMessageTime(user.id);
    if (latestMessageTime && Date.now() - Date.parse(latestMessageTime) < 5000) {
      return { error: "กรุณารอ 5 วินาทีก่อนส่งข้อความถัดไป" };
    }
    const createdAt = new Date().toISOString();
    const chatMessage = { id: randomUUID(), userId: user.id, userName: user.name, message, createdAt };
    await addChatMessage(chatMessage);
    await sendChatPushNotifications(chatMessage, user).catch(() => undefined);
    revalidatePath("/");
    return { error: "", sentAt: createdAt };
  } catch (error) {
    if (error instanceof Error && error.message === "CHAT_COOLDOWN") {
      return { error: "กรุณารอ 5 วินาทีก่อนส่งข้อความถัดไป" };
    }
    return { error: error instanceof Error ? error.message : "ส่งข้อความไม่สำเร็จ กรุณาลองใหม่" };
  }
}
