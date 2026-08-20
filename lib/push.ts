import "server-only";

import webpush from "web-push";
import { getPushSubscriptions, removePushSubscriptions } from "@/lib/store";
import type { ChatMessage, SafeUser } from "@/lib/types";

let configured = false;

function configureWebPush(): boolean {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || `mailto:${process.env.ADMIN_EMAIL || "admin@mystore.local"}`;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export async function sendChatPushNotifications(message: ChatMessage, sender: SafeUser): Promise<void> {
  if (!configureWebPush()) return;

  const subscriptions = await getPushSubscriptions(sender.id);
  const expiredEndpoints: string[] = [];
  const payload = JSON.stringify({
    title: `${sender.name} ส่งข้อความใหม่`,
    body: message.message,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: `chat-${message.id}`,
    url: "/#chat",
  });

  await Promise.allSettled(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime,
        keys: subscription.keys,
      }, payload, { TTL: 60 * 60, urgency: "high" });
    } catch (error) {
      const statusCode = typeof error === "object" && error && "statusCode" in error
        ? Number(error.statusCode)
        : 0;
      if (statusCode === 404 || statusCode === 410) expiredEndpoints.push(subscription.endpoint);
    }
  }));

  await removePushSubscriptions(expiredEndpoints);
}
