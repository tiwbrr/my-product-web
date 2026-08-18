"use client";

import { useEffect, useState } from "react";
import type { StoreSettings } from "@/lib/types";

export function ContactSection({ settings }: { settings: StoreSettings }) {
  const [showLineQr, setShowLineQr] = useState(false);
  useEffect(() => {
    if (!showLineQr) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setShowLineQr(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [showLineQr]);
  if (!settings.lineQrImage && !settings.facebookUrl) return null;
  return <>
    <section className="contact-section" id="contact">
      <div><span className="eyebrow">CONTACT US</span><h2>ช่องทางติดต่อ</h2><p>สอบถามรายละเอียดไอดีเกมและพูดคุยกับร้านได้โดยตรง</p></div>
      <div className="contact-actions">
        {settings.lineQrImage && <button className="contact-card contact-line" onClick={() => setShowLineQr(true)}><span>LINE</span><b>เปิด QR Code</b><small>กดเพื่อสแกนเพิ่มเพื่อน</small></button>}
        {settings.facebookUrl && <a className="contact-card contact-facebook" href={settings.facebookUrl} target="_blank" rel="noreferrer"><span>FACEBOOK</span><b>ไปที่หน้า Facebook</b><small>เปิดลิงก์ในแท็บใหม่ ↗</small></a>}
      </div>
    </section>
    {showLineQr && <div className="qr-modal" role="dialog" aria-modal="true" aria-label="LINE QR Code" onMouseDown={(event) => { if (event.currentTarget === event.target) setShowLineQr(false); }}><div><button className="qr-close" onClick={() => setShowLineQr(false)} aria-label="ปิด">×</button><span className="eyebrow">ADD US ON LINE</span><h2>สแกน QR Code</h2><img src={settings.lineQrImage} alt="QR Code สำหรับติดต่อทาง LINE" /><p>เปิดแอป LINE แล้วสแกนเพื่อเพิ่มเพื่อน</p></div></div>}
  </>;
}
