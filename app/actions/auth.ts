"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, hashPassword, hashToken, SESSION_COOKIE, verifyPassword } from "@/lib/auth";
import { addUser, getUserByEmail, removeSession } from "@/lib/store";

export type AuthState = { error: string };

function clean(value: FormDataEntryValue | null) { return typeof value === "string" ? value.trim() : ""; }

export async function registerAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  const name = clean(formData.get("name"));
  const email = clean(formData.get("email")).toLowerCase();
  const password = clean(formData.get("password"));
  const confirmPassword = clean(formData.get("confirmPassword"));
  if (name.length < 2) return { error: "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "รูปแบบอีเมลไม่ถูกต้อง" };
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return { error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และมีทั้งตัวอักษรกับตัวเลข" };
  if (password !== confirmPassword) return { error: "รหัสผ่านทั้งสองช่องไม่ตรงกัน" };
  if (await getUserByEmail(email)) return { error: "อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ" };

  try {
    const user = await addUser({ id: randomUUID(), name, email, passwordHash: await hashPassword(password), role: "user", createdAt: new Date().toISOString() });
    await createSession(user.id);
  } catch { return { error: "ไม่สามารถสมัครสมาชิกได้ในขณะนี้ กรุณาลองใหม่" }; }
  redirect("/account?welcome=1");
}

export async function loginAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = clean(formData.get("email")).toLowerCase();
  const password = clean(formData.get("password"));
  const next = clean(formData.get("next"));
  const user = await getUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  await createSession(user.id);
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : user.role === "admin" ? "/admin" : "/account");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await removeSession(hashToken(token));
  cookieStore.delete(SESSION_COOKIE);
  redirect("/");
}
