import { redirect } from "next/navigation";
import { StoreHeader } from "@/app/ui/store-header";
import { XOGame } from "@/app/ui/xo-game";
import { getCurrentUser } from "@/lib/auth";
import { getStoreSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function XOGamePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/games/xo");
  const settings = await getStoreSettings();
  if (!settings.xoGameEnabled) redirect("/");

  return <main className="xo-page">
    <StoreHeader user={user} />
    <XOGame user={user} />
  </main>;
}
