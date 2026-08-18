import Link from "next/link";
import { AuthForm } from "@/app/ui/auth-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  return <main className="auth-page"><section className="auth-panel"><Link href="/" className="brand"><span>S</span> SELL ID</Link><div className="auth-heading"><span className="eyebrow">WELCOME BACK</span><h1>ยินดีต้อนรับกลับมา</h1><p>เข้าสู่ระบบเพื่อจัดการบัญชี Sell ID ของคุณ</p></div><AuthForm mode="login" next={typeof params.next === "string" ? params.next : ""} /></section><aside className="auth-art"><div className="auth-quote"><span>“</span><p>เลือกไอดีเกมที่ใช่<br />แล้วเริ่มเล่นได้เลย</p><small>SELL ID · GAME ACCOUNT STORE</small></div></aside></main>;
}
