import "server-only";

import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { getSupabaseAdmin } from "@/lib/supabase";
import { MAX_IMAGE_SIZE_BYTES } from "@/lib/product-constraints";

const bucket = "store-assets";
const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
let bucketReady: Promise<void> | undefined;

async function ensureBucket() {
  bucketReady ??= (async () => {
    const options = {
      public: true,
      fileSizeLimit: MAX_IMAGE_SIZE_BYTES,
      allowedMimeTypes: [...allowedTypes.keys()],
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
  const extension = allowedTypes.get(file.type);
  if (!extension) throw new Error("รองรับรูป JPG, PNG และ WebP เท่านั้น");
  if (file.size > MAX_IMAGE_SIZE_BYTES) throw new Error("รูปภาพแต่ละรูปต้องมีขนาดไม่เกิน 20 MB");
  await ensureBucket();
  const objectPath = `${folder}/${randomUUID()}.${extension}`;
  const { error } = await getSupabaseAdmin().storage
    .from(bucket)
    .upload(objectPath, await file.arrayBuffer(), { contentType: file.type, upsert: false });
  if (error) throw new Error(`อัปโหลดรูปไม่สำเร็จ: ${error.message}`);
  return getSupabaseAdmin().storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
}

export async function removeImage(imageUrl: string) {
  if (!imageUrl) return;
  if (imageUrl.startsWith("/uploads/")) {
    try { await unlink(path.join(process.cwd(), "public", "uploads", path.basename(imageUrl))); }
    catch { /* The old local file may already be gone. */ }
    return;
  }
  const marker = `/storage/v1/object/public/${bucket}/`;
  const markerIndex = imageUrl.indexOf(marker);
  if (markerIndex < 0) return;
  const objectPath = decodeURIComponent(imageUrl.slice(markerIndex + marker.length));
  const { error } = await getSupabaseAdmin().storage.from(bucket).remove([objectPath]);
  if (error) throw new Error(`ลบรูปไม่สำเร็จ: ${error.message}`);
}
