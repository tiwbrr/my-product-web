import "server-only";

import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { getSupabaseAdmin } from "@/lib/supabase";
import { MAX_IMAGE_SIZE_BYTES } from "@/lib/product-constraints";

const bucket = "store-assets";
const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const allowedSoundTypes = new Map([
  ["audio/mpeg", "mp3"],
  ["audio/wav", "wav"],
  ["audio/x-wav", "wav"],
  ["audio/ogg", "ogg"],
]);
const maxSoundSizeBytes = 8 * 1024 * 1024;
let bucketReady: Promise<void> | undefined;

async function ensureBucket() {
  bucketReady ??= (async () => {
    const options = {
      public: true,
      fileSizeLimit: MAX_IMAGE_SIZE_BYTES,
      allowedMimeTypes: [...allowedImageTypes.keys(), ...allowedSoundTypes.keys()],
    };
    const storage = getSupabaseAdmin().storage;
    const { error } = await storage.createBucket(bucket, options);
    if (error && !/already exists|duplicate/i.test(error.message)) throw error;
    if (error) {
      const { error: updateError } = await storage.updateBucket(bucket, options);
      if (updateError) throw updateError;
    }
  })();
  return bucketReady;
}

export async function uploadImage(file: File, folder: "products" | "contacts" | "categories") {
  const extension = allowedImageTypes.get(file.type);
  if (!extension) throw new Error("รองรับรูป JPG, PNG และ WebP เท่านั้น");
  if (file.size > MAX_IMAGE_SIZE_BYTES) throw new Error("รูปภาพแต่ละรูปต้องมีขนาดไม่เกิน 20 MB");
  await ensureBucket();
  const objectPath = `${folder}/${randomUUID()}.${extension}`;
  const { error } = await getSupabaseAdmin().storage
    .from(bucket)
    .upload(objectPath, await file.arrayBuffer(), { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(`อัปโหลดรูปไม่สำเร็จ: ${error.message}`);
  return getSupabaseAdmin().storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
}

export async function uploadNotificationSound(file: File) {
  const extension = allowedSoundTypes.get(file.type);
  if (!extension) throw new Error("รองรับไฟล์เสียง MP3, WAV และ OGG เท่านั้น");
  if (file.size > maxSoundSizeBytes) throw new Error("ไฟล์เสียงต้องมีขนาดไม่เกิน 8 MB");
  await ensureBucket();
  const objectPath = `notification-sounds/${randomUUID()}.${extension}`;
  const { error } = await getSupabaseAdmin().storage
    .from(bucket)
    .upload(objectPath, await file.arrayBuffer(), { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(`อัปโหลดเสียงไม่สำเร็จ: ${error.message}`);
  return getSupabaseAdmin().storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
}

export async function removeStoreAsset(assetUrl: string) {
  if (!assetUrl) return;
  if (assetUrl.startsWith("/uploads/")) {
    try { await unlink(path.join(process.cwd(), "public", "uploads", path.basename(assetUrl))); }
    catch { /* The old local file may already be gone. */ }
    return;
  }
  const marker = `/storage/v1/object/public/${bucket}/`;
  const markerIndex = assetUrl.indexOf(marker);
  if (markerIndex < 0) return;
  const objectPath = decodeURIComponent(assetUrl.slice(markerIndex + marker.length));
  const { error } = await getSupabaseAdmin().storage.from(bucket).remove([objectPath]);
  if (error) throw new Error(`ลบไฟล์ไม่สำเร็จ: ${error.message}`);
}

export async function removeImage(imageUrl: string) {
  return removeStoreAsset(imageUrl);
}
