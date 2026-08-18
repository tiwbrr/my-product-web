"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getStoreSettings, saveStoreSettings } from "@/lib/store";
import { removeImage, uploadImage } from "@/lib/storage";

export type SettingsState = { error: string; success?: string };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function saveContactSettingsAction(
  _state: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  await requireAdmin();
  const current = await getStoreSettings();
  const facebookUrl = text(formData, "facebookUrl");
  if (facebookUrl) {
    try {
      const parsed = new URL(facebookUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    } catch {
      return { error: "กรุณาใส่ลิงก์ Facebook แบบเต็ม เช่น https://facebook.com/ชื่อเพจ" };
    }
  }

  const file = formData.get("lineQrImage");
  const removeCurrent = formData.get("removeLineQr") === "on";
  let lineQrImage = removeCurrent ? "" : current.lineQrImage;
  let uploadedImage = "";
  try {
    if (file instanceof File && file.size > 0) {
      uploadedImage = await uploadImage(file, "contacts");
      lineQrImage = uploadedImage;
    }
    await saveStoreSettings({
      lineQrImage,
      facebookUrl,
      updatedAt: new Date().toISOString(),
    });
    if (current.lineQrImage && current.lineQrImage !== lineQrImage) {
      await removeImage(current.lineQrImage);
    }
    revalidatePath("/");
    revalidatePath("/admin");
    return { error: "", success: "บันทึกช่องทางติดต่อแล้ว" };
  } catch (error) {
    if (uploadedImage) await removeImage(uploadedImage).catch(() => undefined);
    return { error: error instanceof Error ? error.message : "บันทึกช่องทางติดต่อไม่สำเร็จ" };
  }
}
