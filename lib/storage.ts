import "server-only";

import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { getSupabaseAdmin } from "@/lib/supabase";

const bucket = "store-assets";
const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
let bucketReady: Promise<void> | undefined;

async function ensureBucket() {
  bucketReady ??= (async () => {
    const { error } = await getSupabaseAdmin().storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 4 * 1024 * 1024,
      allowedMimeTypes: [...allowedTypes.keys()],
    });
    if (error && !/already exists|duplicate/i.test(error.message)) throw error;
  })();
  return bucketReady;
}

export async function uploadImage(file: File, folder: "products" | "contacts") {
  const extension = allowedTypes.get(file.type);
  if (!extension) throw new Error("รองรับรูป JPG, PNG และ WebP เท่านั้น");
  if (file.size > 4 * 1024 * 1024) throw new Error("รูปภาพต้องมีขนาดไม่เกิน 4 MB");
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
