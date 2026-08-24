"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { hashPassword, hashToken } from "@/lib/auth";
import { isPasswordResetEmailConfigured, sendPasswordResetEmail } from "@/lib/email";
import { createPasswordResetToken, getUserByEmail, removePasswordResetToken, resetUserPassword } from "@/lib/store";

export type PasswordResetState = { error: string; success?: string };

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function passwordError(password: string) {
  return password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)
    ? "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และมีทั้งตัวอักษรกับตัวเลข"
    : "";
}

export async function requestPasswordResetAction(
  _state: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const email = clean(formData.get("email")).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "กรุณากรอกอีเมลให้ถูกต้อง" };
  if (!isPasswordResetEmailConfigured()) return { error: "ระบบส่งอีเมลยังไม่ได้ตั้งค่า กรุณาติดต่อผู้ดูแลร้าน" };

  const genericSuccess = "หากอีเมลนี้มีบัญชีอยู่ ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้ภายในไม่กี่นาที";
  const user = await getUserByEmail(email);
  if (!user) return { error: "", success: genericSuccess };

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  try {
    await createPasswordResetToken({
      id: randomUUID(),
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });
    const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL!);
    if (siteUrl.protocol !== "http:" && siteUrl.protocol !== "https:") throw new Error("INVALID_SITE_URL");
    const resetUrl = new URL("/reset-password", siteUrl);
    resetUrl.searchParams.set("token", token);
    await sendPasswordResetEmail(user.email, resetUrl.toString());
  } catch (error) {
    await removePasswordResetToken(tokenHash).catch(() => undefined);
    console.error("Password reset email failed", error);
  }

  return { error: "", success: genericSuccess };
}

export async function resetPasswordAction(
  _state: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const token = clean(formData.get("token"));
  const password = clean(formData.get("password"));
  const confirmPassword = clean(formData.get("confirmPassword"));
  if (!token || token.length < 32 || token.length > 200) return { error: "ลิงก์ตั้งรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว" };
  const validationError = passwordError(password);
  if (validationError) return { error: validationError };
  if (password !== confirmPassword) return { error: "รหัสผ่านทั้งสองช่องไม่ตรงกัน" };

  try {
    await resetUserPassword(hashToken(token), await hashPassword(password));
  } catch (error) {
    if (error instanceof Error && error.message.includes("RESET_TOKEN_INVALID")) {
      return { error: "ลิงก์ตั้งรหัสผ่านไม่ถูกต้อง หมดอายุ หรือถูกใช้งานไปแล้ว" };
    }
    return { error: "ไม่สามารถตั้งรหัสผ่านใหม่ได้ในขณะนี้ กรุณาลองอีกครั้ง" };
  }

  redirect("/login?reset=success");
}
