"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { requestPasswordResetAction, resetPasswordAction, type PasswordResetState } from "@/app/actions/password-reset";

const initialState: PasswordResetState = { error: "" };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);
  return <form action={formAction} className="auth-form">
    <label>อีเมลที่ใช้สมัคร<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    {state.success && <p className="form-success" role="status">{state.success}</p>}
    <button className="button button-dark button-wide" disabled={pending}>{pending ? "กำลังส่งลิงก์..." : "ส่งลิงก์ตั้งรหัสผ่านใหม่"}</button>
    <p className="auth-switch"><Link href="/login">← กลับไปหน้าเข้าสู่ระบบ</Link></p>
  </form>;
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);
  useEffect(() => {
    window.history.replaceState(null, "", "/reset-password");
  }, []);
  return <form action={formAction} className="auth-form">
    <input type="hidden" name="token" value={token} />
    <label>รหัสผ่านใหม่<input name="password" type="password" autoComplete="new-password" placeholder="อย่างน้อย 8 ตัวอักษร" required minLength={8} /></label>
    <label>ยืนยันรหัสผ่านใหม่<input name="confirmPassword" type="password" autoComplete="new-password" placeholder="กรอกรหัสผ่านอีกครั้ง" required minLength={8} /></label>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    <button className="button button-dark button-wide" disabled={pending}>{pending ? "กำลังตั้งรหัสผ่าน..." : "บันทึกรหัสผ่านใหม่"}</button>
    <p className="auth-switch"><Link href="/login">กลับไปหน้าเข้าสู่ระบบ</Link></p>
  </form>;
}
