"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { sendChatMessageAction, type ChatState } from "@/app/actions/chat";
import type { ChatMessage, SafeUser } from "@/lib/types";

const initialState: ChatState = { error: "" };
const messageLimit = 300;
const cooldownSeconds = 5;

type ToastMessage = ChatMessage & { toastId: string };
type PushStatus = "unsupported" | "off" | "loading" | "on" | "denied" | "error";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(window.atob(base64), (character) => character.charCodeAt(0));
}

export function ChatRoom({ messages: initialMessages, user }: { messages: ChatMessage[]; user: SafeUser }) {
  const [state, formAction, pending] = useActionState(sendChatMessageAction, initialState);
  const [messages, setMessages] = useState(initialMessages);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [characterCount, setCharacterCount] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [pushStatus, setPushStatus] = useState<PushStatus>("off");
  const [pushError, setPushError] = useState("");
  const messageListRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const knownMessageIdsRef = useRef(new Set(initialMessages.map((message) => message.id)));
  const latestMessageTimeRef = useRef(initialMessages.at(-1)?.createdAt || new Date().toISOString());
  const titleTimerRef = useRef<number | null>(null);
  const originalTitleRef = useRef("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

  const stopTitleFlash = useCallback(() => {
    if (titleTimerRef.current !== null) window.clearInterval(titleTimerRef.current);
    titleTimerRef.current = null;
    if (originalTitleRef.current) document.title = originalTitleRef.current;
  }, []);

  const flashTitle = useCallback((senderName: string) => {
    if (document.visibilityState === "visible") return;
    stopTitleFlash();
    let showingAlert = false;
    titleTimerRef.current = window.setInterval(() => {
      showingAlert = !showingAlert;
      document.title = showingAlert ? `● ข้อความใหม่จาก ${senderName}` : originalTitleRef.current;
    }, 850);
  }, [stopTitleFlash]);

  const playNotificationSound = useCallback(() => {
    const context = audioContextRef.current;
    if (!context || context.state !== "running") return;
    const start = context.currentTime;
    [0, 0.13].forEach((offset, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = index ? 880 : 660;
      gain.gain.setValueAtTime(0.0001, start + offset);
      gain.gain.exponentialRampToValueAtTime(0.14, start + offset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.11);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start + offset);
      oscillator.stop(start + offset + 0.12);
    });
  }, []);

  const notifyIncomingMessage = useCallback((message: ChatMessage) => {
    playNotificationSound();
    flashTitle(message.userName);
    setToasts((current) => [...current.slice(-2), { ...message, toastId: `${message.id}-${Date.now()}` }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== message.id));
    }, 6500);
  }, [flashTitle, playNotificationSound]);

  const refreshMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/messages?after=${encodeURIComponent(latestMessageTimeRef.current)}`, { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json() as { messages: ChatMessage[] };
      const incoming = payload.messages.filter((message) => !knownMessageIdsRef.current.has(message.id));
      if (!incoming.length) return;

      incoming.forEach((message) => {
        knownMessageIdsRef.current.add(message.id);
        if (message.userId !== user.id) notifyIncomingMessage(message);
      });
      latestMessageTimeRef.current = incoming.at(-1)?.createdAt || latestMessageTimeRef.current;
      setMessages((current) => [...current, ...incoming].slice(-250));
    } catch {
      // The next polling cycle retries automatically.
    }
  }, [notifyIncomingMessage, user.id]);

  useEffect(() => {
    originalTitleRef.current = document.title;
    const unlockAudio = () => {
      if (!audioContextRef.current) audioContextRef.current = new AudioContext();
      void audioContextRef.current.resume();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") stopTitleFlash();
    };
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      document.removeEventListener("visibilitychange", handleVisibility);
      stopTitleFlash();
      void audioContextRef.current?.close();
    };
  }, [stopTitleFlash]);

  useEffect(() => {
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!state.sentAt) return;
    const timer = window.setTimeout(() => {
      formRef.current?.reset();
      setCharacterCount(0);
      setCooldown(cooldownSeconds);
      void refreshMessages();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshMessages, state.sentAt]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    const timer = window.setInterval(() => void refreshMessages(), 4000);
    return () => window.clearInterval(timer);
  }, [refreshMessages]);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window) || !vapidPublicKey) {
      const timer = window.setTimeout(() => setPushStatus("unsupported"), 0);
      return () => window.clearTimeout(timer);
    }

    void navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      const subscription = await registration.pushManager.getSubscription();
      setPushStatus(subscription ? "on" : Notification.permission === "denied" ? "denied" : "off");
    }).catch(() => setPushStatus("error"));

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === "CHAT_PUSH") void refreshMessages();
    };
    navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
  }, [refreshMessages, vapidPublicKey]);

  const togglePushNotifications = async () => {
    setPushError("");
    setPushStatus("loading");
    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await fetch("/api/push/subscription", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: existing.endpoint }),
        });
        await existing.unsubscribe();
        setPushStatus("off");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      if (!audioContextRef.current) audioContextRef.current = new AudioContext();
      await audioContextRef.current.resume();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const response = await fetch("/api/push/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) {
        await subscription.unsubscribe();
        throw new Error("บันทึกการแจ้งเตือนไม่สำเร็จ");
      }
      setPushStatus("on");
    } catch (error) {
      setPushStatus("error");
      setPushError(error instanceof Error ? error.message : "เปิดการแจ้งเตือนไม่สำเร็จ");
    }
  };

  const pushLabel = pushStatus === "on" ? "🔔 เปิดแจ้งเตือนแล้ว"
    : pushStatus === "loading" ? "กำลังตั้งค่า..."
      : pushStatus === "denied" ? "🔕 เบราว์เซอร์บล็อกการแจ้งเตือน"
        : pushStatus === "unsupported" ? "อุปกรณ์นี้ไม่รองรับการแจ้งเตือน"
          : "🔔 เปิดแจ้งเตือนข้อความใหม่";

  return <section className="community-chat" id="chat">
    <div className="community-heading">
      <div><span>MEMBER COMMUNITY</span><h2>แชทสมาชิก</h2></div>
      <div className="chat-heading-actions">
        <p>ล็อกอินในชื่อ <b>{user.name}</b> · ระบบเก็บข้อความ 7 วัน</p>
        <button className={`push-toggle push-${pushStatus}`} type="button" onClick={togglePushNotifications} disabled={pushStatus === "loading" || pushStatus === "unsupported"}>{pushLabel}</button>
      </div>
    </div>
    {pushError && <p className="chat-error" role="alert">{pushError}</p>}
    <div className="chat-window" ref={messageListRef} aria-live="polite">
      {messages.length ? messages.map((item) => <article className={item.userId === user.id ? "chat-message own-message" : "chat-message"} key={item.id}>
        <div className="chat-avatar">{item.userName.charAt(0).toUpperCase()}</div>
        <div><header><b>{item.userName}</b><time dateTime={item.createdAt}>{new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(item.createdAt))} น.</time></header><p>{item.message}</p></div>
      </article>) : <div className="chat-empty"><b>ยังไม่มีข้อความ</b><span>เริ่มบทสนทนาแรกกับสมาชิกคนอื่นได้เลย</span></div>}
    </div>
    <form action={formAction} ref={formRef} className="chat-form">
      <div className="chat-compose">
        <textarea name="message" rows={2} maxLength={messageLimit} required placeholder={`ส่งข้อความในชื่อ ${user.name}`} aria-label="ข้อความแชท" onInput={(event) => setCharacterCount(event.currentTarget.value.length)} />
        <div className="chat-form-meta"><span>ส่งได้ทุก {cooldownSeconds} วินาที</span><b className={characterCount >= messageLimit ? "at-limit" : ""}>{characterCount}/{messageLimit}</b></div>
      </div>
      <button disabled={pending || cooldown > 0} type="submit">{pending ? "กำลังส่ง..." : cooldown ? `รอ ${cooldown} วิ` : "ส่งข้อความ"}</button>
    </form>
    {state.error && <p className="chat-error" role="alert">{state.error}</p>}
    <div className="chat-toast-stack" aria-live="assertive">
      {toasts.map((toast) => <a className="chat-toast" href="#chat" key={toast.toastId} onClick={() => setToasts((current) => current.filter((item) => item.toastId !== toast.toastId))}>
        <span>{toast.userName.charAt(0).toUpperCase()}</span><div><b>{toast.userName}</b><p>{toast.message}</p></div><i>×</i>
      </a>)}
    </div>
  </section>;
}
