export const dynamic = "force-dynamic";

export async function GET() {
  // The key stays server-configured and only this explicitly public value is
  // returned to the browser. The private VAPID key is never included here.
  const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
  const soundUrlVariable = "NOTIFICATION_SOUND_URL";
  const configuredSoundUrl = process.env[soundUrlVariable]?.trim() || "";
  const notificationSoundUrl = configuredSoundUrl.startsWith("/") || configuredSoundUrl.startsWith("https://")
    ? configuredSoundUrl
    : "";
  return Response.json(
    { publicKey, notificationSoundUrl },
    { headers: { "Cache-Control": "no-store" } },
  );
}
