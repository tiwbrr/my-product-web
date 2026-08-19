"use client";

import { useEffect, useRef } from "react";
import { getYouTubePlaylistId } from "@/lib/youtube";

export function YouTubePlaylist({ url }: { url: string }) {
  const playerRef = useRef<HTMLIFrameElement>(null);
  const playlistId = getYouTubePlaylistId(url);

  useEffect(() => {
    const enableSound = () => {
      const player = playerRef.current?.contentWindow;
      if (!player) return;

      player.postMessage(JSON.stringify({ event: "command", func: "unMute", args: [] }), "*");
      player.postMessage(JSON.stringify({ event: "command", func: "setVolume", args: [100] }), "*");
      removeListeners();
    };

    const removeListeners = () => {
      document.removeEventListener("click", enableSound, true);
      document.removeEventListener("keydown", enableSound, true);
    };

    document.addEventListener("click", enableSound, true);
    document.addEventListener("keydown", enableSound, true);
    return removeListeners;
  }, [playlistId]);

  if (!playlistId) return null;

  return <section className="playlist-section" id="playlist">
    <div className="sell-section-heading"><span>NOW PLAYING</span><h2>YouTube Playlist</h2><p>เพลย์ลิสต์วิดีโอที่ร้านคัดเลือกไว้</p></div>
    <div className="playlist-frame">
      <iframe
        ref={playerRef}
        src={`https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(playlistId)}&autoplay=1&mute=1&enablejsapi=1`}
        title="YouTube playlist ของร้าน"
        loading="eager"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  </section>;
}
