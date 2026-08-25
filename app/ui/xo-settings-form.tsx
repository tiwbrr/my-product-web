"use client";

import { useActionState } from "react";
import { saveXOGameVisibilityAction, type SettingsState } from "@/app/actions/settings";

const initialState: SettingsState = { error: "" };

export function XOSettingsForm({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState(saveXOGameVisibilityAction, initialState);
  return <form action={action} className="xo-settings-form">
    <label><input type="checkbox" name="enabled" defaultChecked={enabled} /><span><b>เปิดระบบมินิเกม X-O</b><small>เมื่อปิด ลิงก์หน้าร้าน หน้าเกม ห้องออนไลน์ และ API ของเกมจะไม่สามารถใช้งานได้</small></span></label>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    {state.success && <p className="form-success" role="status">{state.success}</p>}
    <button className="button button-dark" disabled={pending}>{pending ? "กำลังบันทึก..." : "บันทึกสถานะมินิเกม"}</button>
  </form>;
}
