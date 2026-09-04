"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const adminSections = [
  { id: "overview", icon: "⌂", label: "ภาพรวม" },
  { id: "members", icon: "♙", label: "จัดการสมาชิก", adminOnly: true },
  { id: "hero-media", icon: "▣", label: "พื้นหลังหน้าแรก" },
  { id: "mini-game", icon: "XO", label: "มินิเกม X-O" },
  { id: "contacts", icon: "◎", label: "ติดต่อ Playlist และเสียง" },
  { id: "categories", icon: "●", label: "หมวดเกม" },
  { id: "characters", icon: "♟", label: "รายชื่อตัวละคร" },
  { id: "add-product", icon: "＋", label: "เพิ่มสินค้า" },
  { id: "inventory", icon: "□", label: "รายการสินค้า" },
] as const;

type AdminSectionId = (typeof adminSections)[number]["id"];

export function AdminNav({ canManageUsers }: { canManageUsers: boolean }) {
  const [activeSection, setActiveSection] = useState<AdminSectionId>("overview");
  const visibleSections = useMemo(
    () => adminSections.filter((section) => !("adminOnly" in section) || !section.adminOnly || canManageUsers),
    [canManageUsers],
  );

  useEffect(() => {
    const sections = visibleSections
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);
    let animationFrame = 0;

    const updateActiveSection = () => {
      animationFrame = 0;
      const activationLine = Math.min(180, window.innerHeight * 0.3);
      let current = sections[0]?.id as AdminSectionId | undefined;

      for (const section of sections) {
        if (section.getBoundingClientRect().top <= activationLine) {
          current = section.id as AdminSectionId;
        } else {
          break;
        }
      }

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = sections.at(-1)?.id as AdminSectionId | undefined;
      }

      if (current) setActiveSection(current);
    };

    const scheduleUpdate = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(updateActiveSection);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [visibleSections]);

  return <nav aria-label="เมนูจัดการร้าน">
    {visibleSections.map(({ id, icon, label }) => <a
      href={`#${id}`}
      className={activeSection === id ? "active" : undefined}
      aria-current={activeSection === id ? "location" : undefined}
      onClick={() => setActiveSection(id)}
      key={id}
    ><span>{icon}</span> {label}</a>)}
    <Link href="/"><span>↗</span> ดูหน้าร้าน</Link>
  </nav>;
}
