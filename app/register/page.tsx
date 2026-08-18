import Link from "next/link";
import { AuthForm } from "@/app/ui/auth-form";

export default function RegisterPage() {
  return <main className="auth-page"><section className="auth-panel"><Link href="/" className="brand"><span>M</span> MY STORE</Link><div className="auth-heading"><span className="eyebrow">JOIN THE CLUB</span><h1>สร้างบัญชีของคุณ</h1><p>สมัครสมาชิกฟรี ใช้เวลาไม่ถึงหนึ่งนาที</p></div><AuthForm mode="register" /><p className="privacy-note">การสมัครถือว่าคุณยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว</p></section><aside className="auth-art auth-art-register"><div className="member-card"><span>MEMBER</span><b>MY STORE</b><small>GOOD THINGS, YOUR WAY.</small></div><p>สมาชิกใหม่ เริ่มต้นเรื่องดี ๆ ได้ทุกวัน</p></aside></main>;
}
