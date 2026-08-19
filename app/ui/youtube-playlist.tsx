import { getYouTubePlaylistId } from "@/lib/youtube";

export function YouTubePlaylist({ url }: { url: string }) {
  const playlistId = getYouTubePlaylistId(url);
  if (!playlistId) return null;

  return <section className="playlist-section" id="playlist">
    <div className="sell-section-heading"><span>NOW PLAYING</span><h2>YouTube Playlist</h2><p>เพลย์ลิสต์วิดีโอที่ร้านคัดเลือกไว้</p></div>
    <div className="playlist-frame">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(playlistId)}`}
        title="YouTube playlist ของร้าน"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  </section>;
}
