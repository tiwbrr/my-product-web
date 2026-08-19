"use client";

import { useActionState } from "react";
import { saveContactSettingsAction, type SettingsState } from "@/app/actions/settings";
import type { StoreSettings } from "@/lib/types";

const initialState: SettingsState = { error: "" };

export function ContactSettingsForm({ settings }: { settings: StoreSettings }) {
  const [state, formAction, pending] = useActionState(saveContactSettingsAction, initialState);
  return <form action={formAction} className="product-form contact-settings-form">
    <label>ลิงก์หน้า Facebook<input name="facebookUrl" type="url" defaultValue={settings.facebookUrl} placeholder="https://facebook.com/ชื่อเพจ" /></label>
    <label>ลิงก์ YouTube Playlist<input name="youtubePlaylistUrl" type="url" defaultValue={settings.youtubePlaylistUrl} placeholder="https://www.youtube.com/playlist?list=..." /><small className="field-help">เว้นว่างเพื่อซ่อนตัวเล่นจากหน้าร้าน รองรับลิงก์ YouTube ที่มีค่า list เท่านั้น</small></label>
    {settings.lineQrImage && <div className="current-qr"><img src={settings.lineQrImage} alt="LINE QR ปัจจุบัน" /><label className="checkbox-field"><input type="checkbox" name="removeLineQr" /> ลบ QR ปัจจุบัน</label></div>}
    <label className="file-field"><span>LINE QR Code <small>JPG, PNG หรือ WebP · ไม่เกิน 4 MB</small></span><input name="lineQrImage" type="file" accept="image/jpeg,image/png,image/webp" /><i>{settings.lineQrImage ? "เลือกรูปใหม่เพื่อเปลี่ยน QR" : "อัปโหลดรูป QR สำหรับให้ลูกค้าสแกน"}</i></label>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    {state.success && <p className="form-success" role="status">{state.success}</p>}
    <button className="button button-dark button-wide" disabled={pending}>{pending ? "กำลังบันทึก..." : "บันทึกช่องทางติดต่อและ Playlist"}</button>
  </form>;
}
