import { readFile } from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const projectDirectory = process.cwd();
const { loadEnvConfig } = nextEnv;
loadEnvConfig(projectDirectory);

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    "Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) before migrating",
  );
}

const sourcePath = path.join(projectDirectory, "data", "store.json");
const source = JSON.parse(await readFile(sourcePath, "utf8"));
const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function upsert(table, rows, onConflict) {
  if (rows.length === 0) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`Could not migrate ${table}: ${error.message}`);
}

await upsert(
  "store_users",
  source.users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email.toLowerCase(),
    password_hash: user.passwordHash,
    role: user.role,
    created_at: user.createdAt,
  })),
  "id",
);

await upsert(
  "products",
  source.products.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    price: product.price,
    stock: product.stock,
    account_gender: product.accountGender ?? "unspecified",
    image: product.image,
    images: product.images ?? (product.image ? [product.image] : []),
    featured: product.featured,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  })),
  "id",
);

await upsert(
  "sessions",
  source.sessions
    .filter((session) => new Date(session.expiresAt).getTime() > Date.now())
    .map((session) => ({
      token_hash: session.tokenHash,
      user_id: session.userId,
      expires_at: session.expiresAt,
    })),
  "token_hash",
);

async function countRows(table) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`Could not verify ${table}: ${error.message}`);
  return count ?? 0;
}

const [userCount, productCount, sessionCount] = await Promise.all([
  countRows("store_users"),
  countRows("products"),
  countRows("sessions"),
]);

console.log(
  `Supabase now contains ${userCount} users, ${productCount} products, and ${sessionCount} sessions.`,
);
