import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";
import type { AccountGender, ChatMessage, GameCategory, Product, Session, StoreSettings, User } from "@/lib/types";

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: User["role"];
  created_at: string;
};

type SessionRow = {
  token_hash: string;
  user_id: string;
  expires_at: string;
};

type ProductRow = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number | string;
  stock: number;
  account_gender?: AccountGender | null;
  image: string;
  images?: string[] | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

type StoreSettingsRow = {
  line_qr_image: string;
  facebook_url: string;
  youtube_playlist_url: string;
  updated_at: string;
};

type ChatMessageRow = {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  store_users: { name: string } | { name: string }[] | null;
};

type GameCategoryRow = {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
};

function databaseError(operation: string, error: { message: string; code?: string }) {
  return new Error(`Supabase ${operation} failed: ${error.message}`, { cause: error });
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
  };
}

function toSession(row: SessionRow): Session {
  return {
    tokenHash: row.token_hash,
    userId: row.user_id,
    expiresAt: row.expires_at,
  };
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    price: Number(row.price),
    stock: row.stock,
    accountGender: row.account_gender === "male" || row.account_gender === "female" ? row.account_gender : "unspecified",
    images: row.images?.length ? row.images : row.image ? [row.image] : [],
    featured: row.featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw databaseError("getProducts", error);
  return (data as ProductRow[]).map(toProduct);
}

export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw databaseError("getProduct", error);
  return data ? toProduct(data as ProductRow) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("store_users")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (error) throw databaseError("getUserByEmail", error);
  return data ? toUser(data as UserRow) : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("store_users")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw databaseError("getUserById", error);
  return data ? toUser(data as UserRow) : null;
}

export async function addUser(user: User): Promise<User> {
  const { data, error } = await getSupabaseAdmin()
    .from("store_users")
    .insert({
      id: user.id,
      name: user.name,
      email: user.email.toLowerCase(),
      password_hash: user.passwordHash,
      role: user.role,
      created_at: user.createdAt,
    })
    .select("*")
    .single();
  if (error?.code === "23505") throw new Error("DUPLICATE_EMAIL", { cause: error });
  if (error) throw databaseError("addUser", error);
  return toUser(data as UserRow);
}

export async function addSession(session: Session): Promise<void> {
  const { error } = await getSupabaseAdmin().from("sessions").insert({
    token_hash: session.tokenHash,
    user_id: session.userId,
    expires_at: session.expiresAt,
  });
  if (error) throw databaseError("addSession", error);
}

export async function removeSession(tokenHash: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("sessions")
    .delete()
    .eq("token_hash", tokenHash);
  if (error) throw databaseError("removeSession", error);
}

export async function getSession(tokenHash: string): Promise<Session | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("sessions")
    .select("*")
    .eq("token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw databaseError("getSession", error);
  return data ? toSession(data as SessionRow) : null;
}

export async function saveProduct(product: Product): Promise<Product> {
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .upsert({
      id: product.id,
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price,
      stock: product.stock,
      account_gender: product.accountGender,
      image: product.images[0] ?? "",
      images: product.images,
      featured: product.featured,
      created_at: product.createdAt,
      updated_at: product.updatedAt,
    })
    .select("*")
    .single();
  if (error) throw databaseError("saveProduct", error);
  return toProduct(data as ProductRow);
}

export async function removeProduct(id: string): Promise<Product | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .delete()
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw databaseError("removeProduct", error);
  return data ? toProduct(data as ProductRow) : null;
}

export async function getMemberCount(): Promise<number> {
  const { count, error } = await getSupabaseAdmin()
    .from("store_users")
    .select("id", { count: "exact", head: true })
    .eq("role", "user");
  if (error) throw databaseError("getMemberCount", error);
  return count ?? 0;
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const { data, error } = await getSupabaseAdmin()
    .from("store_settings")
    .select("line_qr_image, facebook_url, youtube_playlist_url, updated_at")
    .eq("id", 1)
    .maybeSingle();
  if (error?.code === "PGRST205" || error?.code === "42P01") {
    return { lineQrImage: "", facebookUrl: "", youtubePlaylistUrl: "", updatedAt: "" };
  }
  if (error) throw databaseError("getStoreSettings", error);
  const row = data as StoreSettingsRow | null;
  return row
    ? { lineQrImage: row.line_qr_image, facebookUrl: row.facebook_url, youtubePlaylistUrl: row.youtube_playlist_url ?? "", updatedAt: row.updated_at }
    : { lineQrImage: "", facebookUrl: "", youtubePlaylistUrl: "", updatedAt: "" };
}

export async function saveStoreSettings(settings: StoreSettings): Promise<StoreSettings> {
  const { data, error } = await getSupabaseAdmin()
    .from("store_settings")
    .upsert({
      id: 1,
      line_qr_image: settings.lineQrImage,
      facebook_url: settings.facebookUrl,
      youtube_playlist_url: settings.youtubePlaylistUrl,
      updated_at: settings.updatedAt,
    })
    .select("line_qr_image, facebook_url, youtube_playlist_url, updated_at")
    .single();
  if (error) throw databaseError("saveStoreSettings", error);
  const row = data as StoreSettingsRow;
  return { lineQrImage: row.line_qr_image, facebookUrl: row.facebook_url, youtubePlaylistUrl: row.youtube_playlist_url ?? "", updatedAt: row.updated_at };
}

const chatRetentionMilliseconds = 7 * 24 * 60 * 60 * 1000;

export async function removeExpiredChatMessages(): Promise<void> {
  const cutoff = new Date(Date.now() - chatRetentionMilliseconds).toISOString();
  const { error } = await getSupabaseAdmin().from("chat_messages").delete().lt("created_at", cutoff);
  if (error) throw databaseError("removeExpiredChatMessages", error);
}

export async function getChatMessages(): Promise<ChatMessage[]> {
  await removeExpiredChatMessages();
  const cutoff = new Date(Date.now() - chatRetentionMilliseconds).toISOString();
  const { data, error } = await getSupabaseAdmin()
    .from("chat_messages")
    .select("id, user_id, message, created_at, store_users(name)")
    .gte("created_at", cutoff)
    .order("created_at", { ascending: true });
  if (error) throw databaseError("getChatMessages", error);
  return (data as ChatMessageRow[]).map((row) => {
    const relatedUser = Array.isArray(row.store_users) ? row.store_users[0] : row.store_users;
    return {
      id: row.id,
      userId: row.user_id,
      userName: relatedUser?.name ?? "สมาชิก",
      message: row.message,
      createdAt: row.created_at,
    };
  });
}

export async function addChatMessage(message: Omit<ChatMessage, "userName">): Promise<void> {
  const { error } = await getSupabaseAdmin().from("chat_messages").insert({
    id: message.id,
    user_id: message.userId,
    message: message.message,
    created_at: message.createdAt,
  });
  if (error) throw databaseError("addChatMessage", error);
}

const fallbackGameCategories: GameCategory[] = [
  { id: "genshin", name: "Genshin", icon: "", sortOrder: 1 },
  { id: "wuthering-wave", name: "Wuthering Wave", icon: "", sortOrder: 2 },
];

function toGameCategory(row: GameCategoryRow): GameCategory {
  return { id: row.id, name: row.name, icon: row.icon, sortOrder: row.sort_order };
}

export async function getGameCategories(): Promise<GameCategory[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("game_categories")
    .select("id, name, icon, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error?.code === "PGRST205" || error?.code === "42P01") return fallbackGameCategories;
  if (error) throw databaseError("getGameCategories", error);
  return data?.length ? (data as GameCategoryRow[]).map(toGameCategory) : fallbackGameCategories;
}

export async function addGameCategory(category: GameCategory): Promise<GameCategory> {
  const { data, error } = await getSupabaseAdmin()
    .from("game_categories")
    .insert({ id: category.id, name: category.name, icon: category.icon, sort_order: category.sortOrder })
    .select("id, name, icon, sort_order")
    .single();
  if (error?.code === "23505") throw new Error("DUPLICATE_CATEGORY", { cause: error });
  if (error) throw databaseError("addGameCategory", error);
  return toGameCategory(data as GameCategoryRow);
}

export async function getGameCategory(id: string): Promise<GameCategory | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("game_categories")
    .select("id, name, icon, sort_order")
    .eq("id", id)
    .maybeSingle();
  if (error) throw databaseError("getGameCategory", error);
  return data ? toGameCategory(data as GameCategoryRow) : null;
}

export async function updateGameCategoryIcon(id: string, icon: string): Promise<GameCategory> {
  const { data, error } = await getSupabaseAdmin()
    .from("game_categories")
    .update({ icon })
    .eq("id", id)
    .select("id, name, icon, sort_order")
    .single();
  if (error) throw databaseError("updateGameCategoryIcon", error);
  return toGameCategory(data as GameCategoryRow);
}

export async function removeGameCategory(id: string): Promise<GameCategory | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("game_categories")
    .delete()
    .eq("id", id)
    .select("id, name, icon, sort_order")
    .maybeSingle();
  if (error) throw databaseError("removeGameCategory", error);
  return data ? toGameCategory(data as GameCategoryRow) : null;
}
