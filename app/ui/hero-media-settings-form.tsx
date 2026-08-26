"use client";

import Image from "next/image";
import { useActionState } from "react";
import { saveHomeHeroMediaAction, type SettingsState } from "@/app/actions/settings";
import type { StoreSettings } from "@/lib/types";

const initialState: SettingsState = { error: "" };

export function HeroMediaSettingsForm({ settings }: { settings: StoreSettings }) {
  const [state, action, pending] = useActionState(saveHomeHeroMediaAction, initialState);
  const hasMedia = Boolean(settings.homeHeroMediaUrl && settings.homeHeroMediaType);

  return <form action={action} className="product-form hero-media-settings-form">
    {hasMedia && <div className="hero-media-admin-preview">
      {settings.homeHeroMediaType === "video"
        ? <video src={settings.homeHeroMediaUrl} controls muted preload="metadata">เบราว์เซอร์นี้ไม่รองรับวิดีโอ</video>
        : <Image src={settings.homeHeroMediaUrl} width={960} height={540} sizes="(max-width: 760px) 100vw, 720px" alt="พื้นหลังหน้าแรกที่ใช้อยู่" />}
      <span>กำลังใช้{settings.homeHeroMediaType === "video" ? "วิดีโอ" : "ภาพ"}นี้เป็นพื้นหลังหน้าแรก</span>
    </div>}
    <label className="file-field"><span>{hasMedia ? "เปลี่ยนพื้นหลัง" : "อัปโหลดพื้นหลังหน้าแรก"} <small>JPG, PNG, WebP, MP4 หรือ WebM · ไม่เกิน 20 MB</small></span><input name="homeHeroMedia" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,.jpg,.jpeg,.png,.webp,.mp4,.webm" /><i>วิดีโอจะแสดงแบบเล่นอัตโนมัติ วนซ้ำ และปิดเสียง แนะนำอัตราส่วน 16:9</i></label>
    {hasMedia && <label className="checkbox-field"><input type="checkbox" name="removeMedia" /><span>ลบไฟล์นี้และกลับไปใช้ภาพเริ่มต้น</span></label>}
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    {state.success && <p className="form-success" role="status">{state.success}</p>}
    <button className="button button-dark" disabled={pending}>{pending ? "กำลังอัปโหลด..." : "บันทึกพื้นหลังหน้าแรก"}</button>
  </form>;
}
