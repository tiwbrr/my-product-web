"use client";

import { useActionState } from "react";
import { deleteContactChannelAction, saveContactChannelAction, saveNotificationSoundAction, savePlaylistSettingsAction, type SettingsState } from "@/app/actions/settings";
import type { ContactChannel, StoreSettings } from "@/lib/types";

const initialState: SettingsState = { error: "" };

function ContactChannelForm({ channel }: { channel?: ContactChannel }) {
  const [state, formAction, pending] = useActionState(saveContactChannelAction, initialState);
  return <div className={channel ? "contact-channel-editor" : "contact-channel-create"}>
    <form action={formAction} className="product-form">
      {channel && <input type="hidden" name="id" value={channel.id} />}
      <div className="field-row">
        <label>ชื่อช่องทาง<input name="name" required minLength={2} maxLength={60} defaultValue={channel?.name} placeholder="เช่น LINE, Discord, TikTok" /></label>
        <label>ลำดับการแสดง<input name="sortOrder" type="number" defaultValue={channel?.sortOrder ?? 0} /></label>
      </div>
      <label>คำอธิบาย<input name="description" maxLength={160} defaultValue={channel?.description} placeholder="เช่น ทักแชทสอบถามรายละเอียดได้ที่นี่" /></label>
      <label>ลิงก์ปลายทาง<input name="url" type="url" defaultValue={channel?.url} placeholder="https://..." /><small className="field-help">ใส่ลิงก์, QR Code หรือทั้งสองอย่างก็ได้</small></label>
      <div className="contact-media-fields">
        <label className="file-field"><span>ภาพไอคอน <small>JPG, PNG หรือ WebP</small></span><input name="iconImage" type="file" accept="image/jpeg,image/png,image/webp" /><i>แนะนำภาพสี่เหลี่ยม ระบบจะแสดงเป็นวงกลม</i></label>
        <label className="file-field"><span>ภาพ QR Code <small>JPG, PNG หรือ WebP</small></span><input name="qrImage" type="file" accept="image/jpeg,image/png,image/webp" /><i>ใช้เมื่ออยากให้ลูกค้ากดเปิด QR เพื่อสแกน</i></label>
      </div>
      {channel && (channel.iconImage || channel.qrImage) && <div className="contact-current-media">
        {channel.iconImage && <label><img src={channel.iconImage} alt={`ไอคอน ${channel.name}`} /><span><input type="checkbox" name="removeIcon" /> ลบไอคอน</span></label>}
        {channel.qrImage && <label><img src={channel.qrImage} alt={`QR ${channel.name}`} /><span><input type="checkbox" name="removeQr" /> ลบ QR</span></label>}
      </div>}
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.success && <p className="form-success" role="status">{state.success}</p>}
      <button className="button button-dark button-wide" disabled={pending}>{pending ? "กำลังบันทึก..." : channel ? "บันทึกการแก้ไข" : "+ เพิ่มช่องทางติดต่อ"}</button>
    </form>
    {channel && <form action={deleteContactChannelAction} className="contact-channel-delete"><input type="hidden" name="id" value={channel.id} /><button type="submit">ลบช่องทางนี้</button></form>}
  </div>;
}

export function ContactSettingsForm({ settings }: { settings: StoreSettings }) {
  const [playlistState, playlistAction, playlistPending] = useActionState(savePlaylistSettingsAction, initialState);
  const [soundState, soundAction, soundPending] = useActionState(saveNotificationSoundAction, initialState);
  return <div className="contact-settings-form">
    <section className="contact-admin-block">
      <div className="contact-admin-heading"><span>01</span><div><h3>YouTube Playlist</h3><p>ตั้งค่าเพลย์ลิสต์ที่แสดงบนหน้าร้าน</p></div></div>
      <form action={playlistAction} className="product-form">
        <label>ลิงก์ YouTube Playlist<input name="youtubePlaylistUrl" type="url" defaultValue={settings.youtubePlaylistUrl} placeholder="https://www.youtube.com/playlist?list=..." /><small className="field-help">เว้นว่างเพื่อซ่อนตัวเล่นจากหน้าร้าน</small></label>
        {playlistState.error && <p className="form-error" role="alert">{playlistState.error}</p>}
        {playlistState.success && <p className="form-success" role="status">{playlistState.success}</p>}
        <button className="button button-dark" disabled={playlistPending}>{playlistPending ? "กำลังบันทึก..." : "บันทึก Playlist"}</button>
      </form>
    </section>

    <section className="contact-admin-block">
      <div className="contact-admin-heading"><span>02</span><div><h3>เสียงแจ้งเตือนแชท</h3><p>อัปโหลดเสียงที่ต้องการให้เล่นเมื่อมีข้อความใหม่</p></div></div>
      <form action={soundAction} className="product-form notification-sound-form">
        {settings.notificationSoundUrl && <div className="notification-sound-preview">
          <b>เสียงที่ใช้อยู่</b>
          <audio controls preload="metadata" src={settings.notificationSoundUrl}>เบราว์เซอร์นี้ไม่รองรับการเล่นเสียง</audio>
        </div>}
        <label className="file-field"><span>{settings.notificationSoundUrl ? "เปลี่ยนไฟล์เสียง" : "อัปโหลดไฟล์เสียง"} <small>MP3, WAV หรือ OGG · ไม่เกิน 8 MB</small></span><input name="notificationSound" type="file" accept="audio/mpeg,audio/wav,audio/x-wav,audio/ogg,.mp3,.wav,.ogg" required={!settings.notificationSoundUrl} /><i>แนะนำไฟล์เสียงสั้นประมาณ 1–3 วินาที</i></label>
        {settings.notificationSoundUrl && <label className="checkbox-field"><input type="checkbox" name="removeSound" /><span>ลบไฟล์นี้และกลับไปใช้เสียง 2 จังหวะมาตรฐาน</span></label>}
        {soundState.error && <p className="form-error" role="alert">{soundState.error}</p>}
        {soundState.success && <p className="form-success" role="status">{soundState.success}</p>}
        <button className="button button-dark" disabled={soundPending}>{soundPending ? "กำลังอัปโหลด..." : "บันทึกเสียงแจ้งเตือน"}</button>
      </form>
    </section>

    <section className="contact-admin-block">
      <div className="contact-admin-heading"><span>03</span><div><h3>เพิ่มช่องทางติดต่อ</h3><p>รองรับแพลตฟอร์มใหม่ ไอคอน ลิงก์ และ QR Code</p></div></div>
      <ContactChannelForm />
    </section>

    <section className="contact-admin-block">
      <div className="contact-admin-heading"><span>04</span><div><h3>ช่องทางที่แสดงอยู่</h3><p>{settings.contactChannels.length} ช่องทาง · กดเพื่อแก้ไขรายละเอียด</p></div></div>
      <div className="contact-channel-list">
        {settings.contactChannels.map((channel) => <details key={channel.id}>
          <summary>{channel.iconImage ? <img src={channel.iconImage} alt="" /> : <i>{channel.name.charAt(0).toUpperCase()}</i>}<span><b>{channel.name}</b><small>{channel.url && channel.qrImage ? "ลิงก์ + QR Code" : channel.qrImage ? "QR Code" : "ลิงก์"}</small></span><em>แก้ไข⌄</em></summary>
          <ContactChannelForm channel={channel} />
        </details>)}
        {!settings.contactChannels.length && <p className="contact-channel-empty">ยังไม่มีช่องทางติดต่อ เพิ่มรายการแรกจากแบบฟอร์มด้านบนได้เลย</p>}
      </div>
    </section>
  </div>;
}
