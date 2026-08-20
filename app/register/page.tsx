import Link from "next/link";
import { AuthForm } from "@/app/ui/auth-form";

export default function RegisterPage() {
  return <main className="auth-page"><section className="auth-panel"><Link href="/" className="brand"><span>K</span> KUOZO SHOP</Link><div className="auth-heading"><span className="eyebrow">JOIN KUOZO SHOP</span><h1>สร้างบัญชีของคุณ</h1><p>สมัครสมาชิกฟรี ใช้เวลาไม่ถึงหนึ่งนาที</p></div><AuthForm mode="register" /><p className="privacy-note">การสมัครถือว่าคุณยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว</p></section><aside className="auth-art auth-art-register"><div className="member-card"><span>MEMBER</span><b>KUOZO SHOP</b><small>FIND YOUR NEXT GAME ACCOUNT.</small></div><p>เลือกดูไอดีเกมที่คุณต้องการได้ง่ายขึ้น</p></aside></main>;
}
