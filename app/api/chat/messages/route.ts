import { getCurrentUser } from "@/lib/auth";
import { getChatMessages } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const after = new URL(request.url).searchParams.get("after");
  const afterTime = after ? Date.parse(after) : Number.NaN;
  const messages = await getChatMessages(Number.isFinite(afterTime) ? new Date(afterTime).toISOString() : undefined);

  return Response.json({ messages }, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
