export const dynamic = "force-dynamic";

export async function GET() {
  // A dynamic lookup keeps this value configurable at server runtime instead of
  // freezing a NEXT_PUBLIC_* value into the client bundle during `next build`.
  const publicKeyVariable = "NEXT_PUBLIC_VAPID_PUBLIC_KEY";
  const publicKey = process.env[publicKeyVariable] || "";
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
