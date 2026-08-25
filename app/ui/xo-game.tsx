"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SafeUser, XOGameRoom } from "@/lib/types";

type Mark = "X" | "O";
type Cell = Mark | null;
type Mode = "bot" | "online" | null;
type BotDifficulty = "easy" | "medium" | "hard";
type BoardSize = 3 | 5 | 10;

function oppositeMark(mark: Mark): Mark {
  return mark === "X" ? "O" : "X";
}

const directions = [[0, 1], [1, 0], [1, 1], [1, -1]] as const;

function winLength(size: BoardSize) {
  return size === 3 ? 3 : size === 5 ? 4 : 5;
}

function gameResult(board: Cell[], size: BoardSize) {
  const required = winLength(size);
  for (let index = 0; index < board.length; index += 1) {
    const mark = board[index];
    if (!mark) continue;
    const row = Math.floor(index / size);
    const column = index % size;
    for (const [rowStep, columnStep] of directions) {
      const line: number[] = [];
      for (let step = 0; step < required; step += 1) {
        const nextRow = row + rowStep * step;
        const nextColumn = column + columnStep * step;
        if (nextRow < 0 || nextRow >= size || nextColumn < 0 || nextColumn >= size) break;
        const nextIndex = nextRow * size + nextColumn;
        if (board[nextIndex] !== mark) break;
        line.push(nextIndex);
      }
      if (line.length === required) return { winner: mark, line };
    }
  }
  return board.every(Boolean) ? { winner: "draw" as const, line: null } : null;
}

function availableMoves(board: Cell[]) {
  return board.map((cell, index) => cell ? -1 : index).filter((index) => index >= 0);
}

function minimax(board: Cell[], maximizing: boolean, depth: number, botMark: Mark, humanMark: Mark): number {
  const result = gameResult(board, 3);
  if (result?.winner === botMark) return 10 - depth;
  if (result?.winner === humanMark) return depth - 10;
  if (result?.winner === "draw") return 0;

  let bestScore = maximizing ? -Infinity : Infinity;
  for (const index of availableMoves(board)) {
    const next = [...board];
    next[index] = maximizing ? botMark : humanMark;
    const score = minimax(next, !maximizing, depth + 1, botMark, humanMark);
    bestScore = maximizing ? Math.max(bestScore, score) : Math.min(bestScore, score);
  }
  return bestScore;
}

function positionScore(board: Cell[], index: number, mark: Mark, size: BoardSize) {
  const next = [...board];
  next[index] = mark;
  const row = Math.floor(index / size);
  const column = index % size;
  let best = 0;
  for (const [rowStep, columnStep] of directions) {
    let count = 1;
    let openEnds = 0;
    for (const direction of [-1, 1]) {
      for (let step = 1; step < winLength(size); step += 1) {
        const nextRow = row + rowStep * step * direction;
        const nextColumn = column + columnStep * step * direction;
        if (nextRow < 0 || nextRow >= size || nextColumn < 0 || nextColumn >= size) break;
        const cell = next[nextRow * size + nextColumn];
        if (cell === mark) count += 1;
        else {
          if (!cell) openEnds += 1;
          break;
        }
      }
    }
    best = Math.max(best, count * count * 10 + openEnds * 3);
  }
  const center = (size - 1) / 2;
  return best + Math.max(0, size - Math.abs(row - center) - Math.abs(column - center));
}

function chooseBotMove(board: Cell[], difficulty: BotDifficulty, size: BoardSize, botMark: Mark, humanMark: Mark) {
  const available = availableMoves(board);
  if (difficulty === "easy") return available[Math.floor(Math.random() * available.length)];

  const completingMove = (mark: Mark) => available.find((index) => {
    const next = [...board];
    next[index] = mark;
    return gameResult(next, size)?.winner === mark;
  });
  const winningMove = completingMove(botMark);
  if (winningMove !== undefined) return winningMove;
  const blockingMove = completingMove(humanMark);
  if (blockingMove !== undefined) return blockingMove;

  if (difficulty === "hard" && size === 3) {
    if (available.length === 9) return 0;
    let bestScore = -Infinity;
    let bestMove = available[0];
    for (const index of available) {
      const next = [...board];
      next[index] = botMark;
      const score = minimax(next, false, 0, botMark, humanMark);
      if (score > bestScore) {
        bestScore = score;
        bestMove = index;
      }
    }
    return bestMove;
  }

  if (difficulty === "hard") {
    return available.reduce((bestMove, index) => {
      const score = positionScore(board, index, botMark, size) + positionScore(board, index, humanMark, size) * .9;
      const bestScore = positionScore(board, bestMove, botMark, size) + positionScore(board, bestMove, humanMark, size) * .9;
      return score > bestScore ? index : bestMove;
    }, available[0]);
  }

  const centers = available.filter((index) => {
    const row = Math.floor(index / size);
    const column = index % size;
    return Math.abs(row - (size - 1) / 2) <= .5 && Math.abs(column - (size - 1) / 2) <= .5;
  });
  const choices = centers.length ? centers : available;
  return choices[Math.floor(Math.random() * choices.length)];
}

function Celebration() {
  return <div className="xo-confetti" aria-hidden="true">
    {Array.from({ length: 24 }, (_, index) => <i key={index} style={{ left: `${4 + (index * 17) % 92}%`, animationDelay: `${(index % 8) * -0.18}s`, animationDuration: `${1.9 + (index % 5) * 0.22}s` }} />)}
  </div>;
}

function LiveScore({ leftName, leftWins, leftLosses, rightName, rightWins, rightLosses, draws }: { leftName: string; leftWins: number; leftLosses: number; rightName: string; rightWins: number; rightLosses: number; draws: number }) {
  return <div className="xo-live-score" aria-label="คะแนนการแข่งขันขณะนี้">
    <article><b>{leftName}</b><div><span>ชนะ <strong>{leftWins}</strong></span><span>แพ้ <strong>{leftLosses}</strong></span></div></article>
    <div><span>เสมอ</span><strong>{draws}</strong></div>
    <article><b>{rightName}</b><div><span>ชนะ <strong>{rightWins}</strong></span><span>แพ้ <strong>{rightLosses}</strong></span></div></article>
  </div>;
}

function roomBoard(board: string): Cell[] {
  return board.split("").map((cell) => cell === "X" || cell === "O" ? cell : null);
}

function Board({ board, size, disabled, winningLine, onMove }: { board: Cell[]; size: BoardSize; disabled: boolean; winningLine?: readonly number[] | null; onMove: (cell: number) => void }) {
  return <div className={`xo-board xo-board-${size}`} style={{ "--xo-board-size": size } as React.CSSProperties} role="grid" aria-label={`กระดานเกม X-O ขนาด ${size} คูณ ${size}`}>
    {board.map((mark, index) => <button
      type="button"
      role="gridcell"
      className={`${mark ? `mark-${mark.toLowerCase()}` : ""} ${winningLine?.includes(index) ? "winning-cell" : ""}`}
      disabled={disabled || Boolean(mark)}
      aria-label={mark ? `ช่อง ${index + 1}: ${mark}` : `เลือกช่อง ${index + 1}`}
      onClick={() => onMove(index)}
      key={index}
    >{mark && <span>{mark}</span>}</button>)}
  </div>;
}

export function XOGame({ user }: { user: SafeUser }) {
  const [mode, setMode] = useState<Mode>(null);
  const [botBoard, setBotBoard] = useState<Cell[]>(Array(9).fill(null));
  const [botBoardSize, setBotBoardSize] = useState<BoardSize>(3);
  const [botRound, setBotRound] = useState(1);
  const [botScore, setBotScore] = useState({ humanWins: 0, botWins: 0, draws: 0 });
  const [botTurn, setBotTurn] = useState(false);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>("medium");
  const [onlineBoardSize, setOnlineBoardSize] = useState<BoardSize>(3);
  const [room, setRoom] = useState<XOGameRoom | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const pollingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const botSoundSnapshotRef = useRef(".........");
  const roomSoundSnapshotRef = useRef<{ id: string; board: string; status: XOGameRoom["status"] } | null>(null);
  const botResult = useMemo(() => gameResult(botBoard, botBoardSize), [botBoard, botBoardSize]);
  const humanMark: Mark = botRound % 2 === 1 ? "X" : "O";
  const botMark = oppositeMark(humanMark);
  const roomId = room?.id;
  const onlineMyMark: Mark | null = room
    ? room.hostUserId === user.id ? room.hostMark : oppositeMark(room.hostMark)
    : null;

  const unlockAudio = useCallback(() => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    return audioContextRef.current.resume();
  }, []);

  const playGameSound = useCallback((kind: "x" | "o" | "win" | "lose" | "draw") => {
    if (!soundEnabled) return;
    void unlockAudio().then(() => {
      const context = audioContextRef.current;
      if (!context) return;
      const patterns = {
        x: [{ frequency: 440, offset: 0, duration: .11 }],
        o: [{ frequency: 620, offset: 0, duration: .13 }],
        win: [{ frequency: 523, offset: 0, duration: .16 }, { frequency: 659, offset: .14, duration: .16 }, { frequency: 784, offset: .28, duration: .28 }],
        lose: [{ frequency: 520, offset: 0, duration: .18 }, { frequency: 410, offset: .16, duration: .18 }, { frequency: 300, offset: .32, duration: .3 }],
        draw: [{ frequency: 440, offset: 0, duration: .16 }, { frequency: 440, offset: .2, duration: .2 }],
      } as const;
      const start = context.currentTime;
      patterns[kind].forEach(({ frequency, offset, duration }) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = kind === "x" ? "triangle" : kind === "o" ? "sine" : "square";
        oscillator.frequency.setValueAtTime(frequency, start + offset);
        gain.gain.setValueAtTime(.0001, start + offset);
        gain.gain.exponentialRampToValueAtTime(kind === "x" || kind === "o" ? .18 : .12, start + offset + .018);
        gain.gain.exponentialRampToValueAtTime(.0001, start + offset + duration);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(start + offset);
        oscillator.stop(start + offset + duration + .02);
      });
    }).catch(() => undefined);
  }, [soundEnabled, unlockAudio]);

  const recordBotOutcome = useCallback((winner: Mark | "draw") => {
    setBotScore((current) => winner === "draw"
      ? { ...current, draws: current.draws + 1 }
      : winner === humanMark
        ? { ...current, humanWins: current.humanWins + 1 }
        : { ...current, botWins: current.botWins + 1 });
  }, [humanMark]);

  useEffect(() => {
    const handleFirstInteraction = () => { void unlockAudio(); };
    window.addEventListener("pointerdown", handleFirstInteraction, { once: true });
    window.addEventListener("keydown", handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, [unlockAudio]);

  useEffect(() => {
    const nextSnapshot = botBoard.map((cell) => cell ?? ".").join("");
    const previousSnapshot = botSoundSnapshotRef.current;
    if (nextSnapshot === previousSnapshot) return;
    botSoundSnapshotRef.current = nextSnapshot;
    const addedIndex = [...nextSnapshot].findIndex((cell, index) => cell !== "." && previousSnapshot[index] === ".");
    if (addedIndex < 0) return;
    playGameSound(nextSnapshot[addedIndex] === "X" ? "x" : "o");
    if (botResult) {
      window.setTimeout(() => playGameSound(botResult.winner === "draw" ? "draw" : botResult.winner === humanMark ? "win" : "lose"), 170);
    }
  }, [botBoard, botResult, humanMark, playGameSound]);

  useEffect(() => {
    if (!room) {
      roomSoundSnapshotRef.current = null;
      return;
    }
    const previous = roomSoundSnapshotRef.current;
    roomSoundSnapshotRef.current = { id: room.id, board: room.board, status: room.status };
    if (!previous || previous.id !== room.id || previous.board === room.board) return;
    const addedIndex = [...room.board].findIndex((cell, index) => cell !== "." && previous.board[index] === ".");
    if (addedIndex >= 0) playGameSound(room.board[addedIndex] === "X" ? "x" : "o");
    if (previous.status === "playing" && room.status !== "playing") {
      const playerWon = (room.status === "x_won" && onlineMyMark === "X") || (room.status === "o_won" && onlineMyMark === "O");
      const outcome = room.status === "draw" ? "draw" : playerWon ? "win" : "lose";
      window.setTimeout(() => playGameSound(outcome), 170);
    }
  }, [onlineMyMark, playGameSound, room]);

  useEffect(() => {
    if (mode !== "bot" || !botTurn || botResult) return;
    const timer = window.setTimeout(() => {
      const move = chooseBotMove(botBoard, botDifficulty, botBoardSize, botMark, humanMark);
      if (move === undefined) return;
      const next = [...botBoard];
      next[move] = botMark;
      const result = gameResult(next, botBoardSize);
      setBotBoard(next);
      if (result) recordBotOutcome(result.winner);
      setBotTurn(false);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [botBoard, botBoardSize, botDifficulty, botMark, botResult, botTurn, humanMark, mode, recordBotOutcome]);

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
    next[cell] = humanMark;
    const result = gameResult(next, botBoardSize);
    setBotBoard(next);
    if (result) recordBotOutcome(result.winner);
    else setBotTurn(true);
  };

  const resetBot = (size = botBoardSize, advanceRound = false) => {
    const nextRound = advanceRound ? botRound + 1 : botRound;
    setBotRound(nextRound);
    setBotBoard(Array(size * size).fill(null));
    setBotTurn(nextRound % 2 === 0);
  };

  const changeBotBoardSize = (size: BoardSize) => {
    setBotBoardSize(size);
    resetBot(size);
  };

  const leaveBotMode = () => {
    setBotRound(1);
    setBotScore({ humanWins: 0, botWins: 0, draws: 0 });
    setBotBoard(Array(botBoardSize * botBoardSize).fill(null));
    setBotTurn(false);
    setMode(null);
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
    <div className="xo-navigation-links"><Link href="/games/xo/leaderboard">🏆 ดูตารางอันดับ</Link><Link href="/">← กลับหน้าร้าน</Link></div>
  </section>;

  if (mode === "bot") {
    const botStatus = botResult?.winner === humanMark ? "คุณชนะ!" : botResult?.winner === botMark ? "บอทชนะ" : botResult?.winner === "draw" ? "เสมอกัน" : botTurn ? "บอทกำลังคิด..." : "ตาของคุณ — เลือกช่องว่าง";
    return <section className="xo-shell xo-game-shell">
      <div className="xo-game-heading"><div className="xo-heading-controls"><button type="button" onClick={leaveBotMode}>← เลือกโหมด</button><Link href="/games/xo/leaderboard">🏆 อันดับ</Link><button className="xo-sound-toggle" type="button" aria-pressed={soundEnabled} onClick={() => setSoundEnabled((enabled) => !enabled)}>{soundEnabled ? "🔊 เสียง: เปิด" : "🔇 เสียง: ปิด"}</button></div><div><span>PLAYING WITH BOT · ROUND {botRound}</span><h1>X-O กับบอท</h1></div></div>
      <div className="xo-match-card">
        {botResult?.winner === humanMark && <Celebration />}
        <div className="xo-players"><div className={!botTurn && !botResult ? "active" : ""}><i className={`mark-${humanMark.toLowerCase()}`}>{humanMark}</i><span><b>{user.name}</b><small>คุณ{humanMark === "X" ? " · เริ่มรอบนี้" : ""}</small></span></div><em>VS</em><div className={botTurn && !botResult ? "active" : ""}><i className={`mark-${botMark.toLowerCase()}`}>{botMark}</i><span><b>KUOZO BOT</b><small>บอท{botMark === "X" ? " · เริ่มรอบนี้" : ""}</small></span></div></div>
        <LiveScore leftName={user.name} leftWins={botScore.humanWins} leftLosses={botScore.botWins} rightName="KUOZO BOT" rightWins={botScore.botWins} rightLosses={botScore.humanWins} draws={botScore.draws} />
        <div className="xo-board-size-picker" aria-label="เลือกขนาดกระดาน"><span>ขนาดกระดาน</span>{([3, 5, 10] as const).map((size) => <button type="button" className={botBoardSize === size ? "active" : ""} aria-pressed={botBoardSize === size} onClick={() => changeBotBoardSize(size)} key={size}>{size}×{size}<small>เรียง {winLength(size)}</small></button>)}</div>
        <div className="xo-difficulty" aria-label="เลือกระดับความยาก"><span>ระดับบอท</span>{(["easy", "medium", "hard"] as const).map((difficulty) => <button type="button" className={botDifficulty === difficulty ? "active" : ""} aria-pressed={botDifficulty === difficulty} onClick={() => { setBotDifficulty(difficulty); resetBot(); }} key={difficulty}>{difficulty === "easy" ? "ง่าย" : difficulty === "medium" ? "กลาง" : "ยาก"}</button>)}</div>
        <p className={`xo-status ${botResult ? "finished" : ""}`}>{botStatus}</p>
        <Board board={botBoard} size={botBoardSize} disabled={botTurn || Boolean(botResult)} winningLine={botResult?.line} onMove={playBotMove} />
        {botResult && <button className="xo-primary-button" type="button" onClick={() => resetBot(botBoardSize, true)}>เล่นรอบถัดไปและสลับคนเริ่ม</button>}
      </div>
    </section>;
  }

  if (!room) return <section className="xo-shell xo-game-shell">
    <div className="xo-game-heading"><div className="xo-heading-controls"><button type="button" onClick={() => setMode(null)}>← เลือกโหมด</button><Link href="/games/xo/leaderboard">🏆 อันดับ</Link><button className="xo-sound-toggle" type="button" aria-pressed={soundEnabled} onClick={() => setSoundEnabled((enabled) => !enabled)}>{soundEnabled ? "🔊 เสียง: เปิด" : "🔇 เสียง: ปิด"}</button></div><div><span>ONLINE MATCH</span><h1>เล่น X-O ออนไลน์</h1></div></div>
    <div className="xo-online-lobby">
      <article><span>สร้างห้องใหม่</span><h2>ชวนเพื่อนมาเล่น</h2><p>เลือกขนาดกระดานแล้วส่งรหัสห้อง 6 ตัวให้สมาชิกอีกคน</p><div className="xo-lobby-size-picker">{([3, 5, 10] as const).map((size) => <button type="button" className={onlineBoardSize === size ? "active" : ""} onClick={() => setOnlineBoardSize(size)} key={size}>{size}×{size}<small>เรียง {winLength(size)}</small></button>)}</div><button className="xo-primary-button" type="button" disabled={busy} onClick={() => void postAction({ action: "create", boardSize: onlineBoardSize })}>{busy ? "กำลังสร้าง..." : `สร้างห้อง ${onlineBoardSize}×${onlineBoardSize}`}</button></article>
      <article><span>เข้าร่วมห้อง</span><h2>มีรหัสห้องแล้ว</h2><p>กรอกรหัส 6 ตัวที่ได้รับจากผู้สร้างห้อง</p><form onSubmit={(event) => { event.preventDefault(); void postAction({ action: "join", code: joinCode }); }}><input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} maxLength={6} placeholder="ABC123" aria-label="รหัสห้อง" /><button className="xo-primary-button" disabled={busy || joinCode.length !== 6}>{busy ? "กำลังเข้า..." : "เข้าร่วมห้อง"}</button></form></article>
    </div>
    {error && <p className="xo-error" role="alert">{error}</p>}
  </section>;

  const board = roomBoard(room.board);
  const onlineResult = gameResult(board, room.boardSize);
  const isHost = room.hostUserId === user.id;
  const guestMark = oppositeMark(room.hostMark);
  const myMark: Mark = isHost ? room.hostMark : guestMark;
  const myTurn = room.status === "playing" && room.turn === myMark;
  const opponentName = isHost ? room.guestName : room.hostName;
  const iAmReady = isHost ? room.rematchHost : room.rematchGuest;
  const opponentReady = isHost ? room.rematchGuest : room.rematchHost;
  const xPlayerName = room.hostMark === "X" ? room.hostName : room.guestName;
  const oPlayerName = room.hostMark === "O" ? room.hostName : room.guestName;
  const winnerName = room.status === "x_won" ? xPlayerName : room.status === "o_won" ? oPlayerName : null;
  const onlineStatus = room.status === "waiting" ? "กำลังรอสมาชิกเข้าร่วมห้อง..."
    : room.status === "draw" ? "เสมอกัน"
      : winnerName ? `${winnerName} ชนะ!`
        : myTurn ? "ตาของคุณ" : `รอ ${opponentName ?? "คู่แข่ง"} เดิน`;

  return <section className="xo-shell xo-game-shell">
    <div className="xo-game-heading"><div className="xo-heading-controls"><button type="button" onClick={() => void leaveRoom()}>← ออกจากห้อง</button><Link href="/games/xo/leaderboard">🏆 อันดับ</Link><button className="xo-sound-toggle" type="button" aria-pressed={soundEnabled} onClick={() => setSoundEnabled((enabled) => !enabled)}>{soundEnabled ? "🔊 เสียง: เปิด" : "🔇 เสียง: ปิด"}</button></div><div><span>ROOM {room.code}</span><h1>การแข่งขันออนไลน์</h1></div></div>
    <div className="xo-match-card">
      {winnerName && (room.status === "x_won" ? myMark === "X" : myMark === "O") && <Celebration />}
      <div className="xo-room-code"><span>รหัสห้อง</span><strong>{room.code}</strong><small>รอบที่ {room.roundNumber} · {room.boardSize}×{room.boardSize} · เรียง {winLength(room.boardSize)} ชนะ</small><button type="button" onClick={() => void copyCode()}>{copied ? "คัดลอกแล้ว" : "คัดลอก"}</button></div>
      <div className="xo-players"><div className={room.turn === room.hostMark && room.status === "playing" ? "active" : ""}><i className={`mark-${room.hostMark.toLowerCase()}`}>{room.hostMark}</i><span><b>{room.hostName}</b><small>ผู้สร้างห้อง{room.hostMark === "X" ? " · เริ่มรอบนี้" : ""}</small></span></div><em>VS</em><div className={room.turn === guestMark && room.status === "playing" ? "active" : ""}><i className={`mark-${guestMark.toLowerCase()}`}>{guestMark}</i><span><b>{room.guestName ?? "กำลังรอ..."}</b><small>ผู้เข้าร่วม{guestMark === "X" ? " · เริ่มรอบนี้" : ""}</small></span></div></div>
      <LiveScore leftName={room.hostName} leftWins={room.hostWins} leftLosses={room.guestWins} rightName={room.guestName ?? "ผู้เข้าร่วม"} rightWins={room.guestWins} rightLosses={room.hostWins} draws={room.roomDraws} />
      <p className={`xo-status ${room.status !== "playing" && room.status !== "waiting" ? "finished" : ""}`}>{onlineStatus}</p>
      <Board board={board} size={room.boardSize} disabled={busy || !myTurn} winningLine={onlineResult?.line} onMove={(cell) => void postAction({ action: "move", roomId: room.id, cell })} />
      {room.status === "waiting" && <p className="xo-room-hint">ส่งรหัส <b>{room.code}</b> ให้สมาชิกอีกคน แล้วรอหน้านี้อัปเดตอัตโนมัติ</p>}
      {["x_won", "o_won", "draw"].includes(room.status) && <div className="xo-rematch"><button className="xo-primary-button" type="button" disabled={busy || iAmReady} onClick={() => void postAction({ action: "rematch", roomId: room.id })}>{iAmReady ? "รอคู่แข่งยืนยัน..." : "ขอเล่นใหม่และสลับคนเริ่ม"}</button>{opponentReady && !iAmReady && <span>คู่แข่งขอเล่นใหม่แล้ว · รอบหน้าจะสลับคนเริ่ม</span>}</div>}
      {error && <p className="xo-error" role="alert">{error}</p>}
    </div>
  </section>;
}
