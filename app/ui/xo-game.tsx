"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SafeUser, XOGameRoom } from "@/lib/types";

type Mark = "X" | "O";
type Cell = Mark | null;
type Mode = "bot" | "online" | null;
type BotDifficulty = "easy" | "medium" | "hard";

const winningLines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
] as const;

function gameResult(board: Cell[]) {
  for (const line of winningLines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return { winner: board[a], line };
  }
  return board.every(Boolean) ? { winner: "draw" as const, line: null } : null;
}

function availableMoves(board: Cell[]) {
  return board.map((cell, index) => cell ? -1 : index).filter((index) => index >= 0);
}

function minimax(board: Cell[], maximizing: boolean, depth: number): number {
  const result = gameResult(board);
  if (result?.winner === "O") return 10 - depth;
  if (result?.winner === "X") return depth - 10;
  if (result?.winner === "draw") return 0;

  let bestScore = maximizing ? -Infinity : Infinity;
  for (const index of availableMoves(board)) {
    const next = [...board];
    next[index] = maximizing ? "O" : "X";
    const score = minimax(next, !maximizing, depth + 1);
    bestScore = maximizing ? Math.max(bestScore, score) : Math.min(bestScore, score);
  }
  return bestScore;
}

function chooseBotMove(board: Cell[], difficulty: BotDifficulty) {
  const available = availableMoves(board);
  if (difficulty === "easy") return available[Math.floor(Math.random() * available.length)];
  if (difficulty === "hard") {
    let bestScore = -Infinity;
    let bestMove = available[0];
    for (const index of available) {
      const next = [...board];
      next[index] = "O";
      const score = minimax(next, false, 0);
      if (score > bestScore) {
        bestScore = score;
        bestMove = index;
      }
    }
    return bestMove;
  }

  const completingMove = (mark: Mark) => available.find((index) => {
    const next = [...board];
    next[index] = mark;
    return gameResult(next)?.winner === mark;
  });
  const winningMove = completingMove("O");
  if (winningMove !== undefined) return winningMove;
  const blockingMove = completingMove("X");
  if (blockingMove !== undefined) return blockingMove;
  if (available.includes(4)) return 4;
  const corners = available.filter((index) => [0, 2, 6, 8].includes(index));
  const choices = corners.length ? corners : available;
  return choices[Math.floor(Math.random() * choices.length)];
}

function Celebration() {
  return <div className="xo-confetti" aria-hidden="true">
    {Array.from({ length: 24 }, (_, index) => <i key={index} style={{ left: `${4 + (index * 17) % 92}%`, animationDelay: `${(index % 8) * -0.18}s`, animationDuration: `${1.9 + (index % 5) * 0.22}s` }} />)}
  </div>;
}

function roomBoard(board: string): Cell[] {
  return board.split("").map((cell) => cell === "X" || cell === "O" ? cell : null);
}

function Board({ board, disabled, winningLine, onMove }: { board: Cell[]; disabled: boolean; winningLine?: readonly number[] | null; onMove: (cell: number) => void }) {
  return <div className="xo-board" role="grid" aria-label="กระดานเกม X-O">
    {board.map((mark, index) => <button
      type="button"
      role="gridcell"
      className={`${mark ? `mark-${mark.toLowerCase()}` : ""} ${winningLine?.includes(index) ? "winning-cell" : ""}`}
      disabled={disabled || Boolean(mark)}
      aria-label={mark ? `ช่อง ${index + 1}: ${mark}` : `เลือกช่อง ${index + 1}`}
      onClick={() => onMove(index)}
      key={index}
    >{mark}</button>)}
  </div>;
}

export function XOGame({ user }: { user: SafeUser }) {
  const [mode, setMode] = useState<Mode>(null);
  const [botBoard, setBotBoard] = useState<Cell[]>(Array(9).fill(null));
  const [botTurn, setBotTurn] = useState(false);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>("medium");
  const [room, setRoom] = useState<XOGameRoom | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef(false);
  const botResult = useMemo(() => gameResult(botBoard), [botBoard]);
  const roomId = room?.id;

  useEffect(() => {
    if (mode !== "bot" || !botTurn || botResult) return;
    const timer = window.setTimeout(() => {
      setBotBoard((current) => {
        const move = chooseBotMove(current, botDifficulty);
        if (move === undefined) return current;
        const next = [...current];
        next[move] = "O";
        return next;
      });
      setBotTurn(false);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [botDifficulty, botResult, botTurn, mode]);

  const refreshRoom = useCallback(async () => {
    if (!roomId || pollingRef.current) return;
    pollingRef.current = true;
    try {
      const response = await fetch(`/api/xo?roomId=${encodeURIComponent(roomId)}`, { cache: "no-store" });
      const payload = await response.json() as { room?: XOGameRoom; error?: string };
      if (response.ok && payload.room) setRoom(payload.room);
      else if (response.status === 404 || response.status === 403) {
        setRoom(null);
        setError(payload.error || "ห้องถูกปิดแล้ว");
      }
    } catch {
      // A later polling cycle retries automatically.
    } finally {
      pollingRef.current = false;
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const timer = window.setInterval(() => void refreshRoom(), 1200);
    return () => window.clearInterval(timer);
  }, [refreshRoom, roomId]);

  const postAction = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/xo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json() as { room?: XOGameRoom; error?: string; success?: boolean };
      if (!response.ok) throw new Error(payload.error || "ดำเนินการไม่สำเร็จ");
      if (payload.room) setRoom(payload.room);
      return payload;
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "ดำเนินการไม่สำเร็จ");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const playBotMove = (cell: number) => {
    if (botTurn || botResult || botBoard[cell]) return;
    const next = [...botBoard];
    next[cell] = "X";
    setBotBoard(next);
    if (!gameResult(next)) setBotTurn(true);
  };

  const resetBot = () => {
    setBotBoard(Array(9).fill(null));
    setBotTurn(false);
  };

  const leaveRoom = async () => {
    if (!room) return;
    const leavingRoomId = room.id;
    setRoom(null);
    await postAction({ action: "leave", roomId: leavingRoomId });
  };

  const copyCode = async () => {
    if (!room) return;
    await navigator.clipboard.writeText(room.code).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  if (!mode) return <section className="xo-shell">
    <div className="xo-intro">
      <span>KUOZO MINI GAME</span><h1>X <i>O</i></h1>
      <p>เลือกเล่นกับบอททันที หรือสร้างห้องเพื่อชวนสมาชิกอีกคนมาแข่งขันออนไลน์</p>
    </div>
    <div className="xo-mode-grid">
      <button type="button" onClick={() => setMode("bot")}><b>เล่นกับบอท</b><span>เริ่มเล่นได้ทันที คุณเป็น X และบอทเป็น O</span><i>เริ่มเกม →</i></button>
      <button type="button" onClick={() => setMode("online")}><b>เล่นออนไลน์</b><span>สร้างห้องหรือใส่รหัส 6 ตัวเพื่อเล่นกับสมาชิก</span><i>เปิดห้อง →</i></button>
    </div>
    <Link href="/" className="xo-back-link">← กลับหน้าร้าน</Link>
  </section>;

  if (mode === "bot") {
    const botStatus = botResult?.winner === "X" ? "คุณชนะ!" : botResult?.winner === "O" ? "บอทชนะ" : botResult?.winner === "draw" ? "เสมอกัน" : botTurn ? "บอทกำลังคิด..." : "ตาของคุณ — เลือกช่องว่าง";
    return <section className="xo-shell xo-game-shell">
      <div className="xo-game-heading"><button type="button" onClick={() => { resetBot(); setMode(null); }}>← เลือกโหมด</button><div><span>PLAYING WITH BOT</span><h1>X-O กับบอท</h1></div></div>
      <div className="xo-match-card">
        {botResult?.winner === "X" && <Celebration />}
        <div className="xo-players"><div className="active"><i>X</i><span><b>{user.name}</b><small>คุณ</small></span></div><em>VS</em><div><i>O</i><span><b>KUOZO BOT</b><small>บอท</small></span></div></div>
        <div className="xo-difficulty" aria-label="เลือกระดับความยาก"><span>ระดับบอท</span>{(["easy", "medium", "hard"] as const).map((difficulty) => <button type="button" className={botDifficulty === difficulty ? "active" : ""} aria-pressed={botDifficulty === difficulty} onClick={() => { setBotDifficulty(difficulty); resetBot(); }} key={difficulty}>{difficulty === "easy" ? "ง่าย" : difficulty === "medium" ? "กลาง" : "ยาก"}</button>)}</div>
        <p className={`xo-status ${botResult ? "finished" : ""}`}>{botStatus}</p>
        <Board board={botBoard} disabled={botTurn || Boolean(botResult)} winningLine={botResult?.line} onMove={playBotMove} />
        {botResult && <button className="xo-primary-button" type="button" onClick={resetBot}>เล่นใหม่</button>}
      </div>
    </section>;
  }

  if (!room) return <section className="xo-shell xo-game-shell">
    <div className="xo-game-heading"><button type="button" onClick={() => setMode(null)}>← เลือกโหมด</button><div><span>ONLINE MATCH</span><h1>เล่น X-O ออนไลน์</h1></div></div>
    <div className="xo-online-lobby">
      <article><span>สร้างห้องใหม่</span><h2>ชวนเพื่อนมาเล่น</h2><p>ระบบจะสร้างรหัสห้อง 6 ตัว ส่งรหัสนี้ให้สมาชิกอีกคน</p><button className="xo-primary-button" type="button" disabled={busy} onClick={() => void postAction({ action: "create" })}>{busy ? "กำลังสร้าง..." : "สร้างห้อง"}</button></article>
      <article><span>เข้าร่วมห้อง</span><h2>มีรหัสห้องแล้ว</h2><p>กรอกรหัส 6 ตัวที่ได้รับจากผู้สร้างห้อง</p><form onSubmit={(event) => { event.preventDefault(); void postAction({ action: "join", code: joinCode }); }}><input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} maxLength={6} placeholder="ABC123" aria-label="รหัสห้อง" /><button className="xo-primary-button" disabled={busy || joinCode.length !== 6}>{busy ? "กำลังเข้า..." : "เข้าร่วมห้อง"}</button></form></article>
    </div>
    {error && <p className="xo-error" role="alert">{error}</p>}
  </section>;

  const board = roomBoard(room.board);
  const onlineResult = gameResult(board);
  const myMark: Mark = room.hostUserId === user.id ? "X" : "O";
  const myTurn = room.status === "playing" && room.turn === myMark;
  const opponentName = myMark === "X" ? room.guestName : room.hostName;
  const iAmReady = myMark === "X" ? room.rematchHost : room.rematchGuest;
  const opponentReady = myMark === "X" ? room.rematchGuest : room.rematchHost;
  const winnerName = room.status === "x_won" ? room.hostName : room.status === "o_won" ? room.guestName : null;
  const onlineStatus = room.status === "waiting" ? "กำลังรอสมาชิกเข้าร่วมห้อง..."
    : room.status === "draw" ? "เสมอกัน"
      : winnerName ? `${winnerName} ชนะ!`
        : myTurn ? "ตาของคุณ" : `รอ ${opponentName ?? "คู่แข่ง"} เดิน`;

  return <section className="xo-shell xo-game-shell">
    <div className="xo-game-heading"><button type="button" onClick={() => void leaveRoom()}>← ออกจากห้อง</button><div><span>ROOM {room.code}</span><h1>การแข่งขันออนไลน์</h1></div></div>
    <div className="xo-match-card">
      {winnerName && (room.status === "x_won" ? myMark === "X" : myMark === "O") && <Celebration />}
      <div className="xo-room-code"><span>รหัสห้อง</span><strong>{room.code}</strong><button type="button" onClick={() => void copyCode()}>{copied ? "คัดลอกแล้ว" : "คัดลอก"}</button></div>
      <div className="xo-players"><div className={room.turn === "X" && room.status === "playing" ? "active" : ""}><i>X</i><span><b>{room.hostName}</b><small>ผู้สร้างห้อง</small></span></div><em>VS</em><div className={room.turn === "O" && room.status === "playing" ? "active" : ""}><i>O</i><span><b>{room.guestName ?? "กำลังรอ..."}</b><small>ผู้เข้าร่วม</small></span></div></div>
      <p className={`xo-status ${room.status !== "playing" && room.status !== "waiting" ? "finished" : ""}`}>{onlineStatus}</p>
      <Board board={board} disabled={busy || !myTurn} winningLine={onlineResult?.line} onMove={(cell) => void postAction({ action: "move", roomId: room.id, cell })} />
      {room.status === "waiting" && <p className="xo-room-hint">ส่งรหัส <b>{room.code}</b> ให้สมาชิกอีกคน แล้วรอหน้านี้อัปเดตอัตโนมัติ</p>}
      {["x_won", "o_won", "draw"].includes(room.status) && <div className="xo-rematch"><button className="xo-primary-button" type="button" disabled={busy || iAmReady} onClick={() => void postAction({ action: "rematch", roomId: room.id })}>{iAmReady ? "รอคู่แข่งยืนยัน..." : "ขอเล่นใหม่"}</button>{opponentReady && !iAmReady && <span>คู่แข่งขอเล่นใหม่แล้ว</span>}</div>}
      {error && <p className="xo-error" role="alert">{error}</p>}
    </div>
  </section>;
}
