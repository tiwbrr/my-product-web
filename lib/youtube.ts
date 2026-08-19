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
