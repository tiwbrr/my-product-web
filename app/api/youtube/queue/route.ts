import { completeYouTubeQueueItem, getYouTubeQueue } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ queue: await getYouTubeQueue() }, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { id?: unknown } | null;
  if (typeof body?.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id)) {
    return Response.json({ error: "Invalid queue item" }, { status: 400 });
  }
  const advanced = await completeYouTubeQueueItem(body.id);
  return Response.json({ advanced }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
