"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { sendChatMessageAction, type ChatState } from "@/app/actions/chat";
import type { ChatMessage, SafeUser } from "@/lib/types";

const initialState: ChatState = { error: "" };

export function ChatRoom({ messages, user }: { messages: ChatMessage[]; user: SafeUser }) {
  const [state, formAction, pending] = useActionState(sendChatMessageAction, initialState);
  const router = useRouter();
  const messageListRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    if (state.sentAt) formRef.current?.reset();
  }, [state.sentAt]);

  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), 15000);
    return () => window.clearInterval(timer);
  }, [router]);

  return <section className="community-chat" id="chat">
    <div className="community-heading">
      <div><span>MEMBER COMMUNITY</span><h2>แชทสมาชิก</h2></div>
      <p>ล็อกอินในชื่อ <b>{user.name}</b> · ระบบเก็บข้อความ 7 วัน</p>
    </div>
    <div className="chat-window" ref={messageListRef} aria-live="polite">
      {messages.length ? messages.map((item) => <article className={item.userId === user.id ? "chat-message own-message" : "chat-message"} key={item.id}>
        <div className="chat-avatar">{item.userName.charAt(0).toUpperCase()}</div>
        <div><header><b>{item.userName}</b><time dateTime={item.createdAt}>{new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(item.createdAt))} น.</time></header><p>{item.message}</p></div>
      </article>) : <div className="chat-empty"><b>ยังไม่มีข้อความ</b><span>เริ่มบทสนทนาแรกกับสมาชิกคนอื่นได้เลย</span></div>}
    </div>
    <form action={formAction} ref={formRef} className="chat-form">
      <textarea name="message" rows={2} maxLength={1000} required placeholder={`ส่งข้อความในชื่อ ${user.name}`} aria-label="ข้อความแชท" />
      <button disabled={pending} type="submit">{pending ? "กำลังส่ง..." : "ส่งข้อความ"}</button>
    </form>
    {state.error && <p className="chat-error" role="alert">{state.error}</p>}
  </section>;
}
