import "server-only";

export function isPasswordResetEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.PASSWORD_RESET_EMAIL_FROM && process.env.NEXT_PUBLIC_SITE_URL);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PASSWORD_RESET_EMAIL_FROM;
  if (!apiKey || !from) throw new Error("PASSWORD_RESET_EMAIL_NOT_CONFIGURED");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "Kuozo-Shop/1.0",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "ตั้งรหัสผ่านใหม่สำหรับ Kuozo Shop",
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#211d27"><h1 style="font-size:24px">ตั้งรหัสผ่านใหม่</h1><p>เราได้รับคำขอเปลี่ยนรหัสผ่านสำหรับบัญชี Kuozo Shop ของคุณ</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#6841ba;color:#fff;text-decoration:none;border-radius:6px">ตั้งรหัสผ่านใหม่</a></p><p>ลิงก์นี้ใช้ได้ครั้งเดียวและจะหมดอายุภายใน 30 นาที</p><p style="font-size:12px;color:#777">หากคุณไม่ได้เป็นผู้ส่งคำขอนี้ สามารถละเว้นอีเมลฉบับนี้ได้</p></div>`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`RESEND_SEND_FAILED:${response.status}:${detail.slice(0, 300)}`);
  }
}
