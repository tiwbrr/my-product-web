"use client";

import { useActionState } from "react";
import { resetXOLeaderboardAction, type XOLeaderboardResetState } from "@/app/actions/xo";

const initialState: XOLeaderboardResetState = { error: "" };

export function XOLeaderboardReset() {
  const [state, action, pending] = useActionState(resetXOLeaderboardAction, initialState);

  return <form
    action={action}
    className="xo-leaderboard-reset"
    onSubmit={(event) => {
      if (!window.confirm("รีเซ็ตสถิติชนะ แพ้ และเสมอของสมาชิกทุกคนใช่หรือไม่? การดำเนินการนี้ย้อนกลับไม่ได้")) {
        event.preventDefault();
      }
    }}
  >
    <button type="submit" disabled={pending}>{pending ? "กำลังรีเซ็ต..." : "รีเซ็ตสถิติอันดับ"}</button>
    {state.success && <span role="status">{state.success}</span>}
    {state.error && <span className="error" role="alert">{state.error}</span>}
  </form>;
}
