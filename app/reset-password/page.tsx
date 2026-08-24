import Link from "next/link";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/app/ui/password-reset-form";

export const metadata: Metadata = { referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  return <main className="auth-page">
    <section className="auth-panel">
      <Link href="/" className="brand"><span>K</span> KUOZO SHOP</Link>
      <div className="auth-heading"><span className="eyebrow">NEW PASSWORD</span><h1>ตั้งรหัสผ่านใหม่</h1><p>กำหนดรหัสผ่านใหม่ที่มีอย่างน้อย 8 ตัวอักษร และมีทั้งตัวอักษรกับตัวเลข</p></div>
      {token
        ? <ResetPasswordForm token={token} />
        : <div className="auth-form"><p className="form-error">ลิงก์ตั้งรหัสผ่านไม่ถูกต้อง กรุณาขอลิงก์ใหม่อีกครั้ง</p><Link className="button button-dark button-wide" href="/forgot-password">ขอลิงก์ใหม่</Link></div>}
    </section>
    <aside className="auth-art"><div className="auth-quote"><span>✓</span><p>ตั้งรหัสผ่านใหม่<br />แล้วกลับมาใช้งาน</p><small>KUOZO SHOP · ACCOUNT SECURITY</small></div></aside>
  </main>;
}
