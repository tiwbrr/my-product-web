import Link from "next/link";
import type { SafeUser } from "@/lib/types";
import { logoutAction } from "@/app/actions/auth";

export function StoreHeader({ user }: { user: SafeUser | null }) {
  return (
    <header className="site-header">
      <Link href="/" className="brand"><span>M</span> MY STORE</Link>
      <nav aria-label="เมนูหลัก"><Link href="/#products">สินค้า</Link><Link href="/#contact">ติดต่อเรา</Link>{user?.role === "admin" && <Link href="/admin">จัดการร้าน</Link>}</nav>
      <div className="header-actions">
        {user ? <><Link href="/account" className="account-pill"><span>{user.name.charAt(0)}</span><b>{user.name}</b></Link><form action={logoutAction}><button className="text-button">ออกจากระบบ</button></form></> : <><Link href="/login" className="text-button">เข้าสู่ระบบ</Link><Link href="/register" className="button button-small button-dark">สมัครสมาชิก</Link></>}
      </div>
    </header>
  );
}
