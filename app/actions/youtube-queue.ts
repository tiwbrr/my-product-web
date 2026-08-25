"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireStaff, requireUser } from "@/lib/auth";
import { addYouTubeQueueItem, getStoreSettings, removeYouTubeQueueItem } from "@/lib/store";
import { getYouTubeVideoId } from "@/lib/youtube";

export type YouTubeQueueState = { error: string; success?: string; queuedAt?: string };

export async function enqueueYouTubeAction(
  _state: YouTubeQueueState,
  formData: FormData,
): Promise<YouTubeQueueState> {
  const user = await requireUser();
  const settings = await getStoreSettings();
  if (!settings.youtubeQueueEnabled) return { error: "ระบบคิวเพลงถูกปิดใช้งานโดยผู้ดูแลร้าน" };
  const value = formData.get("youtubeUrl");
  const videoId = typeof value === "string" ? getYouTubeVideoId(value) : null;
  if (!videoId) return { error: "กรุณาใส่ลิงก์วิดีโอ YouTube ให้ถูกต้อง" };

  try {
    await addYouTubeQueueItem(randomUUID(), videoId, user.id);
    revalidatePath("/");
    return { error: "", success: "เพิ่มเพลงเข้าคิวแล้ว", queuedAt: new Date().toISOString() };
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_YOUTUBE_VIDEO") return { error: "เพลงนี้อยู่ในคิวแล้ว กรุณาเลือกลิงก์อื่น" };
    if (error instanceof Error && error.message === "YOUTUBE_QUEUE_FULL") return { error: "คิวเต็ม 10 รายการแล้ว กรุณารอให้เพลงในคิวเล่นจบก่อน" };
    return { error: error instanceof Error ? error.message : "เพิ่มเพลงเข้าคิวไม่สำเร็จ" };
  }
}

export async function cancelYouTubeQueueItemAction(formData: FormData) {
  await requireStaff();
  const id = formData.get("id");
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return;
  await removeYouTubeQueueItem(id);
  revalidatePath("/");
}
