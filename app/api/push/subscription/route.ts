import { getCurrentUser } from "@/lib/auth";
import { removePushSubscription, savePushSubscription } from "@/lib/store";

type SubscriptionBody = {
  endpoint?: unknown;
  expirationTime?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
};

function parseSubscription(value: SubscriptionBody) {
  if (
    typeof value.endpoint !== "string" || !value.endpoint.startsWith("https://") ||
    typeof value.keys?.p256dh !== "string" || !value.keys.p256dh ||
    typeof value.keys?.auth !== "string" || !value.keys.auth
  ) return null;

  return {
    endpoint: value.endpoint,
    expirationTime: typeof value.expirationTime === "number" ? value.expirationTime : null,
    keys: { p256dh: value.keys.p256dh, auth: value.keys.auth },
  };
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = parseSubscription(await request.json() as SubscriptionBody);
  if (!subscription) return Response.json({ error: "Invalid push subscription" }, { status: 400 });
  await savePushSubscription({ ...subscription, userId: user.id });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { endpoint?: unknown };
  if (typeof body.endpoint !== "string") return Response.json({ error: "Invalid endpoint" }, { status: 400 });
  await removePushSubscription(body.endpoint, user.id);
  return Response.json({ ok: true });
}
