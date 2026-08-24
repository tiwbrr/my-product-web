import Link from "next/link";
import { ForgotPasswordForm } from "@/app/ui/password-reset-form";

export default function ForgotPasswordPage() {
  return <main className="auth-page">
    <section className="auth-panel">
      <Link href="/" className="brand"><span>K</span> KUOZO SHOP</Link>
      <div className="auth-heading"><span className="eyebrow">RESET PASSWORD</span><h1>ลืมรหัสผ่าน?</h1><p>กรอกอีเมลที่ใช้สมัคร เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้คุณ</p></div>
      <ForgotPasswordForm />
    </section>
    <aside className="auth-art"><div className="auth-quote"><span>↗</span><p>กลับเข้าสู่บัญชี<br />อย่างปลอดภัย</p><small>ลิงก์ใช้ได้ครั้งเดียว · 30 นาที</small></div></aside>
  </main>;
}
