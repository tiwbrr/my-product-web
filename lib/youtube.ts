export function getYouTubePlaylistId(value: string): string | null {
  const input = value.trim();
  if (!input) return null;

  try {
    const url = new URL(input);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    if (hostname !== "youtube.com" && hostname !== "m.youtube.com" && hostname !== "music.youtube.com" && hostname !== "youtu.be") return null;
    const playlistId = url.searchParams.get("list") ?? "";
    return /^[A-Za-z0-9_-]{10,120}$/.test(playlistId) ? playlistId : null;
  } catch {
    return null;
  }
}

export function normalizeYouTubePlaylistUrl(value: string): string | null {
  const playlistId = getYouTubePlaylistId(value);
  return playlistId ? `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}` : null;
}

export function getYouTubeVideoId(value: string): string | null {
  const input = value.trim();
  if (!input) return null;

  try {
    const url = new URL(input);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    let videoId = "";
    if (hostname === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? "";
    } else if (hostname === "youtube.com" || hostname === "m.youtube.com" || hostname === "music.youtube.com") {
      const pathParts = url.pathname.split("/").filter(Boolean);
      if (url.pathname === "/watch") videoId = url.searchParams.get("v") ?? "";
      else if (["shorts", "embed", "live"].includes(pathParts[0] ?? "")) videoId = pathParts[1] ?? "";
    } else {
      return null;
    }
    return /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
}

export function normalizeYouTubeVideoUrl(value: string): string | null {
  const videoId = getYouTubeVideoId(value);
  return videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : null;
}
