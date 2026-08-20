"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getStoreSettings, removeContactChannel, saveContactChannel, saveStoreSettings } from "@/lib/store";
import { removeImage, removeStoreAsset, uploadImage, uploadNotificationSound } from "@/lib/storage";
import { normalizeYouTubePlaylistUrl } from "@/lib/youtube";

export type SettingsState = { error: string; success?: string };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function validHttpUrl(value: string) {
  if (!value) return true;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export async function savePlaylistSettingsAction(
  _state: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  await requireAdmin();
  const current = await getStoreSettings();
  const input = text(formData, "youtubePlaylistUrl");
  const normalized = input ? normalizeYouTubePlaylistUrl(input) : "";
  if (input && !normalized) return { error: "กรุณาใส่ลิงก์ YouTube Playlist ที่มีรหัส list" };

  try {
    await saveStoreSettings({ ...current, youtubePlaylistUrl: normalized || "", updatedAt: new Date().toISOString() });
    revalidatePath("/");
    revalidatePath("/admin");
    return { error: "", success: "บันทึก YouTube Playlist แล้ว" };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "บันทึก Playlist ไม่สำเร็จ" };
  }
}

export async function saveNotificationSoundAction(
  _state: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  await requireAdmin();
  const current = await getStoreSettings();
  const removeSound = formData.get("removeSound") === "on";
  const soundFile = formData.get("notificationSound");
  const hasNewFile = soundFile instanceof File && soundFile.size > 0;
  if (!hasNewFile && !removeSound && !current.notificationSoundUrl) {
    return { error: "กรุณาเลือกไฟล์เสียง MP3, WAV หรือ OGG" };
  }

  let uploadedSound = "";
  try {
    if (hasNewFile) uploadedSound = await uploadNotificationSound(soundFile);
    const notificationSoundUrl = uploadedSound || (removeSound ? "" : current.notificationSoundUrl);
    await saveStoreSettings({ ...current, notificationSoundUrl, updatedAt: new Date().toISOString() });
    if (current.notificationSoundUrl && current.notificationSoundUrl !== notificationSoundUrl) {
      await removeStoreAsset(current.notificationSoundUrl).catch(() => undefined);
    }
    revalidatePath("/");
    revalidatePath("/admin");
    return {
      error: "",
      success: notificationSoundUrl ? "บันทึกเสียงแจ้งเตือนแล้ว" : "กลับมาใช้เสียง 2 จังหวะมาตรฐานแล้ว",
    };
  } catch (error) {
    if (uploadedSound) await removeStoreAsset(uploadedSound).catch(() => undefined);
    return { error: error instanceof Error ? error.message : "บันทึกเสียงแจ้งเตือนไม่สำเร็จ" };
  }
}

export async function saveContactChannelAction(
  _state: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  await requireAdmin();
  const settings = await getStoreSettings();
  const id = text(formData, "id");
  const current = id ? settings.contactChannels.find((channel) => channel.id === id) : undefined;
  if (id && !current) return { error: "ไม่พบช่องทางติดต่อที่ต้องการแก้ไข" };

  const name = text(formData, "name");
  const description = text(formData, "description");
  const url = text(formData, "url");
  const rawSortOrder = Number(text(formData, "sortOrder"));
  if (name.length < 2 || name.length > 60) return { error: "ชื่อช่องทางต้องมี 2–60 ตัวอักษร" };
  if (description.length > 160) return { error: "คำอธิบายต้องไม่เกิน 160 ตัวอักษร" };
  if (!validHttpUrl(url)) return { error: "ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://" };

  const removeIcon = formData.get("removeIcon") === "on";
  const removeQr = formData.get("removeQr") === "on";
  let iconImage = removeIcon ? "" : current?.iconImage || "";
  let qrImage = removeQr ? "" : current?.qrImage || "";
  const uploadedImages: string[] = [];

  try {
    const iconFile = formData.get("iconImage");
    if (iconFile instanceof File && iconFile.size > 0) {
      iconImage = await uploadImage(iconFile, "contacts");
      uploadedImages.push(iconImage);
    }
    const qrFile = formData.get("qrImage");
    if (qrFile instanceof File && qrFile.size > 0) {
      qrImage = await uploadImage(qrFile, "contacts");
      uploadedImages.push(qrImage);
    }
    if (!url && !qrImage) {
      await Promise.all(uploadedImages.map((image) => removeImage(image).catch(() => undefined)));
      return { error: "กรุณาใส่ลิงก์หรืออัปโหลดภาพ QR อย่างน้อยหนึ่งอย่าง" };
    }

    const now = new Date().toISOString();
    await saveContactChannel({
      id: current?.id || randomUUID(),
      name,
      description,
      url,
      iconImage,
      qrImage,
      sortOrder: Number.isFinite(rawSortOrder) ? Math.trunc(rawSortOrder) : 0,
      createdAt: current?.createdAt || now,
      updatedAt: now,
    });

    const replacedImages = [current?.iconImage, current?.qrImage]
      .filter((image): image is string => Boolean(image) && image !== iconImage && image !== qrImage);
    await Promise.all(replacedImages.map((image) => removeImage(image).catch(() => undefined)));
    revalidatePath("/");
    revalidatePath("/admin");
    return { error: "", success: current ? "บันทึกช่องทางติดต่อแล้ว" : "เพิ่มช่องทางติดต่อแล้ว" };
  } catch (error) {
    await Promise.all(uploadedImages.map((image) => removeImage(image).catch(() => undefined)));
    return { error: error instanceof Error ? error.message : "บันทึกช่องทางติดต่อไม่สำเร็จ" };
  }
}

export async function deleteContactChannelAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  if (!id) return;
  const removed = await removeContactChannel(id);
  if (removed) {
    await Promise.all([removed.iconImage, removed.qrImage].filter(Boolean).map((image) => removeImage(image).catch(() => undefined)));
  }
  revalidatePath("/");
  revalidatePath("/admin");
}
