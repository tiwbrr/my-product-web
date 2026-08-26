import Link from "next/link";
import { redirect } from "next/navigation";
import { StoreHeader } from "@/app/ui/store-header";
import { XOLeaderboardReset } from "@/app/ui/xo-leaderboard-reset";
import { getCurrentUser } from "@/lib/auth";
import { getStoreSettings, getXOLeaderboard } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function XOLeaderboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/games/xo/leaderboard");
  const settings = await getStoreSettings();
  if (!settings.xoGameEnabled) redirect("/");
  const leaderboard = await getXOLeaderboard();

  return <main className="xo-page">
    <div className="xo-arcade-background" aria-hidden="true"><i>X</i><i>O</i><i>X</i><i>O</i><i>X</i><i>O</i></div>
    <StoreHeader user={user} />
    <section className="xo-shell xo-leaderboard-shell">
      <header className="xo-leaderboard-heading"><div><span>ONLINE RANKING</span><h1>ตารางอันดับ X-O</h1><p>จัดอันดับจากจำนวนชนะในการแข่งขันออนไลน์ แสดงสูงสุด 100 คน</p></div><div className="xo-leaderboard-actions"><Link href="/games/xo">← กลับไปเล่นเกม</Link>{(user.role === "admin" || user.role === "manager") && <XOLeaderboardReset />}</div></header>
      <div className="xo-leaderboard-card">
        <div className="xo-leaderboard-header"><span>อันดับ</span><span>สมาชิก</span><span>ชนะ</span><span>แพ้</span><span>เสมอ</span></div>
        {leaderboard.map((player, index) => <article className={`${player.userId === user.id ? "current-player" : ""} ${index < 3 ? `top-${index + 1}` : ""}`} key={player.userId}>
          <strong>{index === 0 ? "♛" : index === 1 ? "◆" : index === 2 ? "●" : index + 1}</strong>
          <div><i>{player.userName.charAt(0).toUpperCase()}</i><span><b>{player.userName}</b>{player.userId === user.id && <small>คุณ</small>}</span></div>
          <em>{player.wins.toLocaleString("th-TH")}</em><span>{player.losses.toLocaleString("th-TH")}</span><span>{player.draws.toLocaleString("th-TH")}</span>
        </article>)}
        {!leaderboard.length && <div className="xo-leaderboard-empty"><b>ยังไม่มีสถิติการแข่งขัน</b><p>เล่นออนไลน์ให้จบเกมแรก แล้วชื่อผู้เล่นทั้งสองคนจะปรากฏที่นี่</p><Link href="/games/xo">เริ่มเล่นออนไลน์ →</Link></div>}
      </div>
      <p className="xo-leaderboard-note">นับเฉพาะการแข่งขันออนไลน์เท่านั้น · การเล่นกับบอทจะไม่ถูกบันทึก</p>
    </section>
  </main>;
}
