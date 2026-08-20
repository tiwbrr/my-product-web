"use client";

import { useEffect, useState } from "react";
import type { ContactChannel, StoreSettings } from "@/lib/types";

export function ContactSection({ settings }: { settings: StoreSettings }) {
  const [selectedQr, setSelectedQr] = useState<ContactChannel | null>(null);
  useEffect(() => {
    if (!selectedQr) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setSelectedQr(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [selectedQr]);

  if (!settings.contactChannels.length) return null;
  return <>
    <section className="contact-section" id="contact">
      <div><span className="eyebrow">CONTACT US</span><h2>ช่องทางติดต่อ</h2><p>สอบถามรายละเอียดไอดีเกมและพูดคุยกับร้านผ่านช่องทางที่สะดวกได้โดยตรง</p></div>
      <div className="contact-actions">
        {settings.contactChannels.map((channel, index) => {
          const content = <><span className="contact-card-icon">{channel.iconImage ? <img src={channel.iconImage} alt="" /> : channel.name.charAt(0).toUpperCase()}</span><div><small>{channel.name}</small><b>{channel.description || (channel.qrImage ? "เปิด QR Code" : "เปิดลิงก์ติดต่อ")}</b><em>{channel.qrImage ? "กดเพื่อดู QR Code" : "เปิดในแท็บใหม่ ↗"}</em></div></>;
          return channel.qrImage
            ? <button className={`contact-card contact-tone-${index % 3}`} onClick={() => setSelectedQr(channel)} key={channel.id}>{content}</button>
            : <a className={`contact-card contact-tone-${index % 3}`} href={channel.url} target="_blank" rel="noreferrer" key={channel.id}>{content}</a>;
        })}
      </div>
    </section>
    {selectedQr && <div className="qr-modal" role="dialog" aria-modal="true" aria-label={`QR Code ${selectedQr.name}`} onMouseDown={(event) => { if (event.currentTarget === event.target) setSelectedQr(null); }}>
      <div><button className="qr-close" onClick={() => setSelectedQr(null)} aria-label="ปิด">×</button><span className="eyebrow">{selectedQr.name}</span><h2>สแกน QR Code</h2><img src={selectedQr.qrImage} alt={`QR Code สำหรับติดต่อทาง ${selectedQr.name}`} /><p>{selectedQr.description || `สแกน QR Code เพื่อติดต่อผ่าน ${selectedQr.name}`}</p>{selectedQr.url && <a className="button button-dark button-wide contact-modal-link" href={selectedQr.url} target="_blank" rel="noreferrer">เปิดลิงก์ {selectedQr.name} ↗</a>}</div>
    </div>}
  </>;
}
