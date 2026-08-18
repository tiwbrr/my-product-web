import Link from "next/link";
import { AuthForm } from "@/app/ui/auth-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  return <main className="auth-page"><section className="auth-panel"><Link href="/" className="brand"><span>M</span> MY STORE</Link><div className="auth-heading"><span className="eyebrow">WELCOME BACK</span><h1>ยินดีต้อนรับกลับมา</h1><p>เข้าสู่ระบบเพื่อจัดการบัญชีและรับประสบการณ์ที่ต่อเนื่อง</p></div><AuthForm mode="login" next={typeof params.next === "string" ? params.next : ""} /></section><aside className="auth-art"><div className="auth-quote"><span>“</span><p>เลือกของที่ใช่<br />ให้ทุกวันรู้สึกดีขึ้น</p><small>MY STORE · EVERYDAY GOODS</small></div></aside></main>;
}
