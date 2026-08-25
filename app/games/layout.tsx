import type { ReactNode } from "react";
import { ChatRoom } from "@/app/ui/chat-room";
import { getCurrentUser } from "@/lib/auth";
import { chatPageSize, getChatMessages } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function GamesLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const messages = user ? await getChatMessages({ limit: chatPageSize + 1 }) : [];

  return <div className="games-layout">
    {children}
    {user && <ChatRoom messages={messages} user={user} />}
  </div>;
}
