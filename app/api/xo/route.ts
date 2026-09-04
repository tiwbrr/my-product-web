import { randomBytes, randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import {
  createXOGameRoom,
  getStoreSettings,
  getXOGameRoom,
  getXOGameRoomByCode,
  getLobbyXOGameRooms,
  joinXOGameRoom,
  leaveXOGameRoom,
  leaveXOGameRoomsForUser,
  playXOMove,
  requestXORematch,
} from "@/lib/store";

export const dynamic = "force-dynamic";

const roomCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function roomCode() {
  const bytes = randomBytes(6);
  return Array.from(bytes, (byte) => roomCodeAlphabet[byte % roomCodeAlphabet.length]).join("");
}

function noStore(payload: unknown, init?: ResponseInit) {
  return Response.json(payload, { ...init, headers: { ...init?.headers, "Cache-Control": "no-store, max-age=0" } });
}

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("XO_ROOM_NOT_FOUND")) return "ไม่พบห้องนี้หรือห้องหมดอายุแล้ว";
  if (message.includes("XO_CANNOT_JOIN_OWN_ROOM")) return "ไม่สามารถเข้าร่วมห้องที่ตัวเองสร้างได้";
  if (message.includes("XO_ROOM_FULL")) return "ห้องนี้มีผู้เล่นครบแล้ว";
  if (message.includes("XO_NOT_YOUR_TURN")) return "ยังไม่ถึงตาของคุณ";
  if (message.includes("XO_CELL_TAKEN")) return "ช่องนี้ถูกเลือกไปแล้ว";
  if (message.includes("XO_GAME_NOT_PLAYING")) return "เกมนี้ยังไม่เริ่มหรือจบไปแล้ว";
  if (message.includes("XO_NOT_A_PLAYER")) return "คุณไม่ได้เป็นผู้เล่นในห้องนี้";
  if (message.includes("XO_GAME_NOT_FINISHED")) return "เกมยังไม่จบ";
  return "ดำเนินการกับห้อง X-O ไม่สำเร็จ กรุณาลองใหม่";
}

async function getAuthorizedContext() {
  const user = await getCurrentUser();
  if (!user) return { response: noStore({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 }) } as const;
  const settings = await getStoreSettings();
  if (!settings.xoGameEnabled) return { response: noStore({ error: "ระบบมินิเกมถูกปิดใช้งาน" }, { status: 403 }) } as const;
  return { user } as const;
}

export async function GET(request: Request) {
  const context = await getAuthorizedContext();
  if ("response" in context) return context.response;
  const searchParams = new URL(request.url).searchParams;

  if (searchParams.get("openRooms") === "1") {
    try {
      return noStore({ rooms: await getLobbyXOGameRooms() });
    } catch (error) {
      return noStore({ error: errorMessage(error) }, { status: 500 });
    }
  }

  const id = searchParams.get("roomId")?.trim() ?? "";
  if (!id) return noStore({ error: "กรุณาระบุห้อง" }, { status: 400 });

  try {
    const room = await getXOGameRoom(id);
    if (!room) return noStore({ error: "ไม่พบห้องนี้หรือห้องหมดอายุแล้ว" }, { status: 404 });
    return noStore({ room });
  } catch (error) {
    return noStore({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const context = await getAuthorizedContext();
  if ("response" in context) return context.response;

  let body: { action?: string; roomId?: string; code?: string; cell?: number; boardSize?: number };
  try {
    body = await request.json();
  } catch {
    return noStore({ error: "ข้อมูลคำขอไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    if (body.action === "create") {
      const boardSize = body.boardSize === 5 || body.boardSize === 10 ? body.boardSize : 3;
      await leaveXOGameRoomsForUser(context.user.id);
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          const room = await createXOGameRoom(randomUUID(), roomCode(), context.user.id, boardSize);
          return noStore({ room }, { status: 201 });
        } catch (error) {
          if (!(error instanceof Error) || !error.message.includes("23505") || attempt === 4) throw error;
        }
      }
    }

    if (body.action === "join") {
      const code = (body.code ?? "").trim().toUpperCase();
      if (!/^[A-Z0-9]{6}$/.test(code)) return noStore({ error: "รหัสห้องต้องมี 6 ตัวอักษร" }, { status: 400 });
      const existing = await getXOGameRoomByCode(code);
      if (!existing) return noStore({ error: "ไม่พบห้องนี้หรือห้องหมดอายุแล้ว" }, { status: 404 });
      await leaveXOGameRoomsForUser(context.user.id, existing.id);
      await joinXOGameRoom(existing.id, context.user.id);
      return noStore({ room: await getXOGameRoom(existing.id) });
    }

    const roomId = body.roomId?.trim() ?? "";
    if (!roomId) return noStore({ error: "กรุณาระบุห้อง" }, { status: 400 });

    if (body.action === "move") {
      if (!Number.isInteger(body.cell) || (body.cell ?? -1) < 0 || (body.cell ?? 100) > 99) {
        return noStore({ error: "ตำแหน่งเดินไม่ถูกต้อง" }, { status: 400 });
      }
      await playXOMove(roomId, context.user.id, body.cell as number);
      return noStore({ room: await getXOGameRoom(roomId) });
    }
    if (body.action === "rematch") {
      await requestXORematch(roomId, context.user.id);
      return noStore({ room: await getXOGameRoom(roomId) });
    }
    if (body.action === "leave") {
      await leaveXOGameRoom(roomId, context.user.id);
      return noStore({ success: true });
    }
    return noStore({ error: "ไม่รู้จักคำสั่งนี้" }, { status: 400 });
  } catch (error) {
    return noStore({ error: errorMessage(error) }, { status: 409 });
  }

  return noStore({ error: "สร้างห้องไม่สำเร็จ" }, { status: 500 });
}
