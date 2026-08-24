"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { enqueueYouTubeAction, cancelYouTubeQueueItemAction, type YouTubeQueueState } from "@/app/actions/youtube-queue";
import { FormSubmitButton } from "@/app/ui/form-submit-button";
import { getYouTubePlaylistId } from "@/lib/youtube";
import type { SafeUser, YouTubeQueueItem } from "@/lib/types";

type YouTubePlayer = {
  destroy(): void;
  playVideo(): void;
  unMute(): void;
  setVolume(volume: number): void;
  setLoop(loop: boolean): void;
};

type YouTubeNamespace = {
  Player: new (element: HTMLElement, options: {
    width: string;
    height: string;
    videoId?: string;
    playerVars: Record<string, string | number>;
    events: {
      onReady(event: { target: YouTubePlayer }): void;
      onStateChange(event: { data: number }): void;
      onError(): void;
    };
  }) => YouTubePlayer;
  PlayerState: { ENDED: number };
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeNamespace> | undefined;

function loadYouTubeApi(): Promise<YouTubeNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve, reject) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      if (window.YT) resolve(window.YT);
      else reject(new Error("YouTube API unavailable"));
    };

    if (!document.getElementById("youtube-iframe-api")) {
      const script = document.createElement("script");
      script.id = "youtube-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.addEventListener("error", () => reject(new Error("โหลด YouTube Player ไม่สำเร็จ")), { once: true });
      document.head.appendChild(script);
    }
  });
  return youtubeApiPromise;
}

const initialFormState: YouTubeQueueState = { error: "" };

export function YouTubePlaylist({
  url,
  user,
  initialQueue,
}: {
  url: string;
  user: SafeUser | null;
  initialQueue: YouTubeQueueItem[];
}) {
  const [queue, setQueue] = useState(initialQueue);
  const [formState, formAction, formPending] = useActionState(enqueueYouTubeAction, initialFormState);
  const [playerError, setPlayerError] = useState("");
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const advancingRef = useRef(false);
  const soundUnlockedRef = useRef(false);
  const playlistId = getYouTubePlaylistId(url);
  const headItemId = queue[0]?.id ?? "";
  const headVideoId = queue[0]?.videoId ?? "";
  const canManageQueue = user?.role === "admin" || user?.role === "manager";

  const refreshQueue = useCallback(async () => {
    try {
      const response = await fetch("/api/youtube/queue", { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json() as { queue: YouTubeQueueItem[] };
      setQueue(payload.queue);
    } catch {
      // The next polling cycle retries automatically.
    }
  }, []);

  const advanceQueue = useCallback(async (id: string) => {
    if (!id || advancingRef.current) return;
    advancingRef.current = true;
    try {
      await fetch("/api/youtube/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await refreshQueue();
    } finally {
      advancingRef.current = false;
    }
  }, [refreshQueue]);

  useEffect(() => {
    const timer = window.setInterval(() => void refreshQueue(), 4000);
    return () => window.clearInterval(timer);
  }, [refreshQueue]);

  useEffect(() => {
    if (!formState.queuedAt) return;
    const timer = window.setTimeout(() => {
      formRef.current?.reset();
      void refreshQueue();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [formState.queuedAt, refreshQueue]);

  useEffect(() => {
    const enableSound = () => {
      if (!playerRef.current) return;
      soundUnlockedRef.current = true;
      playerRef.current.unMute();
      playerRef.current.setVolume(100);
      removeListeners();
    };
    const removeListeners = () => {
      document.removeEventListener("click", enableSound, true);
      document.removeEventListener("keydown", enableSound, true);
    };
    document.addEventListener("click", enableSound, true);
    document.addEventListener("keydown", enableSound, true);
    return removeListeners;
  }, []);

  useEffect(() => {
    const wrapper = playerWrapperRef.current;
    if (!wrapper || (!headVideoId && !playlistId)) {
      playerRef.current?.destroy();
      playerRef.current = null;
      if (wrapper) wrapper.replaceChildren();
      return;
    }

    let cancelled = false;
    setPlayerError("");
    void loadYouTubeApi().then((YT) => {
      if (cancelled || !playerWrapperRef.current) return;
      playerRef.current?.destroy();
      const mount = document.createElement("div");
      playerWrapperRef.current.replaceChildren(mount);
      const queuedItemId = headItemId;
      playerRef.current = new YT.Player(mount, {
        width: "100%",
        height: "100%",
        videoId: headVideoId || undefined,
        playerVars: headVideoId
          ? { autoplay: 1, mute: 1, playsinline: 1, rel: 0 }
          : { autoplay: 1, mute: 1, playsinline: 1, rel: 0, loop: 1, listType: "playlist", list: playlistId! },
        events: {
          onReady: (event) => {
            if (soundUnlockedRef.current) {
              event.target.unMute();
              event.target.setVolume(100);
            }
            if (!queuedItemId) event.target.setLoop(true);
            event.target.playVideo();
          },
          onStateChange: (event) => {
            if (queuedItemId && event.data === YT.PlayerState.ENDED) void advanceQueue(queuedItemId);
          },
          onError: () => {
            if (queuedItemId) void advanceQueue(queuedItemId);
            else setPlayerError("ไม่สามารถเล่น Playlist ของร้านได้ในขณะนี้");
          },
        },
      });
    }).catch((error) => {
      if (!cancelled) setPlayerError(error instanceof Error ? error.message : "โหลด YouTube Player ไม่สำเร็จ");
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [advanceQueue, headItemId, headVideoId, playlistId]);

  if (!user && !playlistId && !queue.length) return null;

  return <section className="playlist-section" id="playlist">
    <div className="sell-section-heading"><span>NOW PLAYING</span><h2>คิวเพลง YouTube</h2><p>{queue.length ? "กำลังเล่นเพลงที่สมาชิกเพิ่มเข้าคิว" : playlistId ? "คิวว่าง กำลังเล่น Playlist ที่ร้านตั้งไว้" : "เพิ่มเพลงแรกเข้าคิวได้เลย"}</p></div>
    {(headVideoId || playlistId) && <div className="playlist-frame"><div className="youtube-player-mount" ref={playerWrapperRef} />{playerError && <p className="youtube-player-error">{playerError}</p>}</div>}
    <p className="youtube-sound-hint">หากยังไม่มีเสียง ให้กดที่หน้าเว็บหนึ่งครั้งเพื่อเปิดเสียงตามข้อจำกัดของเบราว์เซอร์</p>

    <div className="youtube-queue-panel">
      <div className="youtube-queue-heading"><div><b>คิวเพลง</b><span>{queue.length}/10 รายการ</span></div>{!user && <Link href="/login?next=%2F%23playlist">เข้าสู่ระบบเพื่อเพิ่มเพลง</Link>}</div>
      {user && <form action={formAction} ref={formRef} className="youtube-queue-form">
        <input name="youtubeUrl" type="url" required placeholder="วางลิงก์วิดีโอ YouTube เช่น https://youtu.be/..." aria-label="ลิงก์วิดีโอ YouTube" />
        <button type="submit" disabled={formPending || queue.length >= 10}>{formPending ? "กำลังเพิ่ม..." : queue.length >= 10 ? "คิวเต็ม" : "เพิ่มเข้าคิว"}</button>
        {formState.error && <p className="form-error" role="alert">{formState.error}</p>}
        {formState.success && <p className="form-success" role="status">{formState.success}</p>}
      </form>}

      <div className="youtube-queue-list">
        {queue.map((item, index) => <article className={index === 0 ? "playing" : undefined} key={item.id}>
          <span>{index === 0 ? "▶" : index + 1}</span>
          <div><b>{index === 0 ? "กำลังเล่น" : `เพลงคิวที่ ${index + 1}`}</b><a href={`https://www.youtube.com/watch?v=${item.videoId}`} target="_blank" rel="noreferrer">youtube.com/watch?v={item.videoId}</a><small>เพลงที่สมาชิกเพิ่มเข้าคิว</small></div>
          {canManageQueue && <form action={cancelYouTubeQueueItemAction}><input type="hidden" name="id" value={item.id} /><FormSubmitButton pendingLabel="กำลังยกเลิก...">ยกเลิกเพลง</FormSubmitButton></form>}
        </article>)}
        {!queue.length && <div className="youtube-queue-empty">ยังไม่มีเพลงจากสมาชิก {playlistId && "ระบบจะเล่น Playlist ของร้านไปก่อน"}</div>}
      </div>
    </div>
  </section>;
}
