"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = { error: "" };

export function AuthForm({ mode, next = "" }: { mode: "login" | "register"; next?: string }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const register = mode === "register";
  return (
    <form action={formAction} className="auth-form">
      {next && <input type="hidden" name="next" value={next} />}
      {register && <label>ชื่อที่ใช้แสดง<input name="name" autoComplete="name" placeholder="เช่น พิมพ์ชนก" required minLength={2} /></label>}
      <label>อีเมล<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
      <label>รหัสผ่าน<input name="password" type="password" autoComplete={register ? "new-password" : "current-password"} placeholder="อย่างน้อย 8 ตัวอักษร" required minLength={8} /></label>
      {register && <label>ยืนยันรหัสผ่าน<input name="confirmPassword" type="password" autoComplete="new-password" placeholder="กรอกรหัสผ่านอีกครั้ง" required minLength={8} /></label>}
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="button button-dark button-wide" disabled={pending}>{pending ? "กำลังดำเนินการ..." : register ? "สร้างบัญชีสมาชิก" : "เข้าสู่ระบบ"}</button>
      <p className="auth-switch">{register ? "มีบัญชีอยู่แล้ว?" : "ยังไม่เป็นสมาชิก?"} <Link href={register ? "/login" : "/register"}>{register ? "เข้าสู่ระบบ" : "สมัครฟรี"}</Link></p>
    </form>
  );
}
