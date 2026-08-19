"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import type { SafeUser } from "@/lib/types";

export function StoreHeader({ user }: { user: SafeUser | null }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", close); document.body.style.overflow = ""; };
  }, [open]);
  const closeMenu = () => setOpen(false);
  return <>
    <header className="game-header">
      <Link href="/#categories" className="game-header-category">หมวดหมู่เกม</Link>
      <Link href="/" className="game-brand"><span>S</span><b>SELL ID</b></Link>
      <button className="hamburger-button" onClick={() => setOpen(true)} aria-label="เปิดเมนู" aria-expanded={open}><i></i><i></i><i></i></button>
    </header>
    {open && <div className="menu-overlay" onMouseDown={(event) => { if (event.currentTarget === event.target) closeMenu(); }}>
      <aside className="menu-drawer" aria-label="เมนูหลัก">
        <div className="menu-drawer-head"><span>MENU</span><button onClick={closeMenu} aria-label="ปิดเมนู">×</button></div>
        <nav><Link href="/" onClick={closeMenu}><span>01</span>หน้าหลัก</Link><Link href="/#categories" onClick={closeMenu}><span>02</span>หมวดหมู่เกม</Link><Link href="/#products" onClick={closeMenu}><span>03</span>รายการไอดีทั้งหมด</Link><Link href="/#chat" onClick={closeMenu}><span>04</span>แชทสมาชิก</Link><Link href="/#contact" onClick={closeMenu}><span>05</span>ติดต่อร้านค้า</Link>{user?.role === "admin" && <Link href="/admin" onClick={closeMenu}><span>06</span>จัดการร้าน</Link>}</nav>
        <div className="menu-account">{user ? <><Link href="/account" onClick={closeMenu}>บัญชีของ {user.name}</Link><form action={logoutAction}><button>ออกจากระบบ</button></form></> : <><Link href="/login" onClick={closeMenu}>เข้าสู่ระบบ</Link><Link href="/register" onClick={closeMenu}>สมัครสมาชิก</Link></>}</div>
        <small>SELL ID · GAME ACCOUNT STORE</small>
      </aside>
    </div>}
  </>;
}
