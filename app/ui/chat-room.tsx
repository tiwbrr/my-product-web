"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { sendChatMessageAction, type ChatState } from "@/app/actions/chat";
import type { ChatMessage, SafeUser } from "@/lib/types";

const initialState: ChatState = { error: "" };
const messageLimit = 300;
const cooldownSeconds = 5;

type ToastMessage = ChatMessage & { toastId: string };
type PushStatus = "unsupported" | "insecure" | "unconfigured" | "off" | "loading" | "on" | "denied" | "error";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(window.atob(base64), (character) => character.charCodeAt(0));
}

function NotificationBell({ muted }: { muted: boolean }) {
  return <svg className="notification-bell" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    <path d="M10 21h4" />
    {muted && <path className="notification-bell-slash" d="M4 4l16 16" />}
  </svg>;
}

export function ChatRoom({ messages: initialMessages, user }: { messages: ChatMessage[]; user: SafeUser }) {
  const [state, formAction, pending] = useActionState(sendChatMessageAction, initialState);
  const [messages, setMessages] = useState(initialMessages);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [characterCount, setCharacterCount] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [pushStatus, setPushStatus] = useState<PushStatus>("loading");
  const [pushError, setPushError] = useState("");
  const [vapidPublicKey, setVapidPublicKey] = useState("");
  const messageListRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const knownMessageIdsRef = useRef(new Set(initialMessages.map((message) => message.id)));
  const latestMessageTimeRef = useRef(initialMessages.at(-1)?.createdAt || new Date().toISOString());
  const titleTimerRef = useRef<number | null>(null);
  const originalTitleRef = useRef("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const customSoundUrlRef = useRef("");
  const customSoundRef = useRef<HTMLAudioElement | null>(null);

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
    const playTwoBeatFallback = () => {
      const context = audioContextRef.current;
      if (!context) return;
      void context.resume().then(() => {
        const start = context.currentTime;
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -12;
        compressor.knee.value = 12;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.2;
        compressor.connect(context.destination);

        let remainingBeats = 2;
        [0, 0.26].forEach((offset, index) => {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.type = "triangle";
          oscillator.frequency.value = index ? 980 : 740;
          gain.gain.setValueAtTime(0.0001, start + offset);
          gain.gain.exponentialRampToValueAtTime(0.38, start + offset + 0.018);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.19);
          oscillator.connect(gain).connect(compressor);
          oscillator.addEventListener("ended", () => {
            gain.disconnect();
            remainingBeats -= 1;
            if (!remainingBeats) compressor.disconnect();
          }, { once: true });
          oscillator.start(start + offset);
          oscillator.stop(start + offset + 0.2);
        });
      }).catch(() => undefined);
    };

    if (customSoundUrlRef.current) {
      if (!customSoundRef.current) {
        customSoundRef.current = new Audio(customSoundUrlRef.current);
        customSoundRef.current.preload = "auto";
        customSoundRef.current.volume = 1;
      }
      customSoundRef.current.currentTime = 0;
      void customSoundRef.current.play().catch(playTwoBeatFallback);
      return;
    }
    playTwoBeatFallback();
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
      if (customSoundUrlRef.current && !customSoundRef.current) {
        customSoundRef.current = new Audio(customSoundUrlRef.current);
        customSoundRef.current.preload = "auto";
        customSoundRef.current.volume = 1;
        customSoundRef.current.load();
      }
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
      customSoundRef.current?.pause();
      customSoundRef.current = null;
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
    let cancelled = false;
    const preparePushNotifications = async () => {
      if (!window.isSecureContext) {
        setPushStatus("insecure");
        return;
      }
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setPushStatus("unsupported");
        return;
      }

      try {
        const response = await fetch("/api/push/config", { cache: "no-store" });
        const config = await response.json() as { publicKey?: string; notificationSoundUrl?: string };
        if (!response.ok || !config.publicKey) {
          setPushStatus("unconfigured");
          return;
        }
        if (cancelled) return;
        setVapidPublicKey(config.publicKey);
        customSoundUrlRef.current = config.notificationSoundUrl || "";
        const registration = await navigator.serviceWorker.register("/sw.js");
        const subscription = await registration.pushManager.getSubscription();
        if (!cancelled) setPushStatus(subscription ? "on" : Notification.permission === "denied" ? "denied" : "off");
      } catch {
        if (!cancelled) {
          setPushStatus("error");
          setPushError("เตรียมระบบแจ้งเตือนไม่สำเร็จ กรุณารีเฟรชหน้าแล้วลองใหม่");
        }
      }
    };
    void preparePushNotifications();

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === "CHAT_PUSH") void refreshMessages();
    };
    navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
    };
  }, [refreshMessages]);

  const togglePushNotifications = async () => {
    setPushError("");
    setPushStatus("loading");
    try {
      if (!vapidPublicKey) throw new Error("เซิร์ฟเวอร์ยังไม่ได้ตั้งค่าระบบแจ้งเตือน");
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
      playNotificationSound();
      void registration.showNotification("เปิดแจ้งเตือนแล้ว", {
        body: "เมื่อมีข้อความใหม่ ระบบจะแจ้งเตือนแม้ไม่ได้เปิดหน้านี้อยู่",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "push-enabled",
        data: { url: "/#chat" },
      }).catch(() => setPushError("เปิดแจ้งเตือนแล้ว แต่ระบบไม่สามารถแสดงข้อความทดสอบได้"));
    } catch (error) {
      setPushStatus("error");
      setPushError(error instanceof Error ? error.message : "เปิดการแจ้งเตือนไม่สำเร็จ");
    }
  };

  const soundEnabled = pushStatus === "on";
  const pushLabel = pushStatus === "loading" ? "กำลังตั้งค่า..."
    : `เสียงแจ้งเตือน : ${soundEnabled ? "เปิด" : "ปิด"}`;

  return <section className="community-chat" id="chat">
    <div className="community-heading">
      <div><span>MEMBER COMMUNITY</span><h2>แชทสมาชิก</h2></div>
      <div className="chat-heading-actions">
        <p>ล็อกอินในชื่อ <b>{user.name}</b></p>
        <button
          className={`push-toggle push-${pushStatus}`}
          type="button"
          onClick={togglePushNotifications}
          disabled={["loading", "unsupported", "insecure", "unconfigured"].includes(pushStatus)}
          aria-label={pushLabel}
          aria-pressed={soundEnabled}
        >
          <NotificationBell muted={!soundEnabled} />
          <span>{pushLabel}</span>
        </button>
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
