import { getCurrentUser } from "@/lib/auth";
import { chatPageSize, getChatMessages } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = new URL(request.url).searchParams;
  const after = searchParams.get("after");
  const before = searchParams.get("before");
  const afterTime = after ? Date.parse(after) : Number.NaN;
  const beforeTime = before ? Date.parse(before) : Number.NaN;
  const isAfterQuery = Number.isFinite(afterTime);
  const isBeforeQuery = !isAfterQuery && Number.isFinite(beforeTime);
  const messages = await getChatMessages({
    after: isAfterQuery ? new Date(afterTime).toISOString() : undefined,
    before: isBeforeQuery ? new Date(beforeTime).toISOString() : undefined,
    limit: isBeforeQuery ? chatPageSize + 1 : chatPageSize,
  });
  const hasMore = isBeforeQuery && messages.length > chatPageSize;

  return Response.json({ messages: hasMore ? messages.slice(1) : messages, hasMore }, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
