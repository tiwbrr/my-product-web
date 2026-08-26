"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { resetXOLeaderboard } from "@/lib/store";

export type XOLeaderboardResetState = { error: string; success?: string };

export async function resetXOLeaderboardAction(
  _state: XOLeaderboardResetState,
  _formData: FormData,
): Promise<XOLeaderboardResetState> {
  void _state;
  void _formData;
  await requireStaff();

  try {
    await resetXOLeaderboard();
    revalidatePath("/games/xo/leaderboard");
    return { error: "", success: "รีเซ็ตสถิติอันดับออนไลน์ทั้งหมดแล้ว" };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "รีเซ็ตสถิติอันดับไม่สำเร็จ" };
  }
}
