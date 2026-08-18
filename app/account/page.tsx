import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const [user, params] = await Promise.all([requireUser(), searchParams]);
  return <main className="account-page"><div className="account-card"><Link href="/" className="brand"><span>M</span> MY STORE</Link>{params.welcome && <p className="success-banner">สมัครสมาชิกสำเร็จ ยินดีต้อนรับสู่ My Store!</p>}{params.error === "forbidden" && <p className="form-error">บัญชีนี้ไม่มีสิทธิ์เข้าหน้าจัดการร้าน</p>}<div className="avatar-large">{user.name.charAt(0)}</div><span className="eyebrow">YOUR ACCOUNT</span><h1>สวัสดี, {user.name}</h1><p>{user.email}</p><div className="account-actions">{user.role === "admin" && <Link href="/admin" className="button button-dark">ไปหน้าจัดการร้าน</Link>}<Link href="/" className="button button-outline">กลับหน้าร้าน</Link><form action={logoutAction}><button className="text-button danger">ออกจากระบบ</button></form></div></div></main>;
}
