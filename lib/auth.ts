import { createHash, randomBytes, randomUUID, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { addSession, addUser, getMemberCount as countMembers, getSessionUser, getUserByEmail } from "@/lib/store";
import type { SafeUser, User } from "@/lib/types";

export const SESSION_COOKIE = "my_store_session";
const sessionDuration = 7 * 24 * 60 * 60 * 1000;
let adminReady: Promise<void> | undefined;

function scrypt(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => nodeScrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(key as Buffer)));
}

export async function hashPassword(password: string) { const salt = randomBytes(16).toString("hex"); const key = await scrypt(password, salt); return `${salt}:${key.toString("hex")}`; }
export async function verifyPassword(password: string, stored: string) { const [salt, value] = stored.split(":"); if (!salt || !value) return false; const expected = Buffer.from(value, "hex"); const actual = await scrypt(password, salt); return expected.length === actual.length && timingSafeEqual(expected, actual); }
export function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
function toSafeUser(user: User): SafeUser { const { passwordHash: _passwordHash, ...safe } = user; return safe; }

export async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@mystore.local").toLowerCase();
  const existing = await getUserByEmail(email);
  if (existing) return existing;
  const passwordHash = await hashPassword(process.env.ADMIN_PASSWORD || "Admin@12345");
  try { return await addUser({ id: randomUUID(), name: process.env.ADMIN_NAME || "Store Admin", email, passwordHash, role: "admin", createdAt: new Date().toISOString() }); }
  catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_EMAIL") return (await getUserByEmail(email))!;
    throw error;
  }
}

function ensureAdminOnce() {
  adminReady ??= ensureAdmin()
    .then(() => undefined)
    .catch((error) => {
      adminReady = undefined;
      throw error;
    });
  return adminReady;
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await addSession({ tokenHash: hashToken(token), userId, expiresAt: new Date(Date.now() + sessionDuration).toISOString() });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: sessionDuration / 1000 });
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  await ensureAdminOnce();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const user = await getSessionUser(hashToken(token));
  return user ? toSafeUser(user) : null;
}

export async function requireUser() { const user = await getCurrentUser(); if (!user) redirect("/login"); return user; }
export async function requireAdmin() { const user = await getCurrentUser(); if (!user) redirect("/login?next=/admin"); if (user.role !== "admin") redirect("/account?error=forbidden"); return user; }
export async function getMemberCount() { return countMembers(); }
