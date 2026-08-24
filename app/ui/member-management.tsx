"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { deleteMemberAction, updateMemberRoleAction, type MemberActionState } from "@/app/actions/members";
import type { SafeUser } from "@/lib/types";

const initialState: MemberActionState = { error: "" };
const pageSize = 10;

function roleLabel(role: SafeUser["role"]) {
  if (role === "admin") return "แอดมิน";
  if (role === "manager") return "ผู้ดูแลร้าน";
  return "สมาชิก";
}

function MemberActions({ user }: { user: SafeUser }) {
  const [roleState, roleAction, rolePending] = useActionState(updateMemberRoleAction, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteMemberAction, initialState);

  return <div className="member-admin-actions">
    <form action={roleAction}>
      <input type="hidden" name="id" value={user.id} />
      <label>
        <span className="sr-only">สิทธิ์ของ {user.name}</span>
        <select name="role" defaultValue={user.role} aria-label={`สิทธิ์ของ ${user.name}`}>
          <option value="user">สมาชิก</option>
          <option value="manager">ผู้ดูแลร้าน</option>
        </select>
      </label>
      <button type="submit" disabled={rolePending}>{rolePending ? "กำลังบันทึก..." : "บันทึกสิทธิ์"}</button>
    </form>
    <form action={deleteAction} onSubmit={(event) => {
      if (!window.confirm(`ลบบัญชี ${user.name} (${user.email}) ใช่หรือไม่? ข้อมูลที่เกี่ยวข้องจะถูกลบด้วย`)) event.preventDefault();
    }}>
      <input type="hidden" name="id" value={user.id} />
      <button className="member-delete-button" type="submit" disabled={deletePending}>{deletePending ? "กำลังลบ..." : "ลบบัญชี"}</button>
    </form>
    {roleState.error && <p className="form-error" role="alert">{roleState.error}</p>}
    {roleState.success && <p className="form-success" role="status">{roleState.success}</p>}
    {deleteState.error && <p className="form-error" role="alert">{deleteState.error}</p>}
  </div>;
}

export function MemberManagement({ users, currentUserId }: { users: SafeUser[]; currentUserId: string }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("th-TH");
    if (!keyword) return users;
    return users.filter((user) => `${user.name} ${user.email}`.toLocaleLowerCase("th-TH").includes(keyword));
  }, [query, users]);
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const firstItem = (currentPage - 1) * pageSize;
  const visibleUsers = filteredUsers.slice(firstItem, firstItem + pageSize);

  const goToPage = (nextPage: number) => {
    setPage(Math.min(pageCount, Math.max(1, nextPage)));
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return <div className="member-management" ref={containerRef}>
    <div className="member-search-row">
      <label>
        <span>ค้นหาบัญชี</span>
        <input
          type="search"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setPage(1); }}
          placeholder="ค้นหาจากชื่อหรืออีเมล"
        />
      </label>
      <span>แสดง {filteredUsers.length ? firstItem + 1 : 0}–{Math.min(firstItem + pageSize, filteredUsers.length)} จาก {filteredUsers.length} บัญชี</span>
    </div>
    <div className="member-admin-list">
    {visibleUsers.map((user) => <article key={user.id}>
      <div className="member-admin-avatar">{user.name.charAt(0).toUpperCase()}</div>
      <div className="member-admin-identity">
        <b>{user.name}{user.id === currentUserId && <small>บัญชีของคุณ</small>}</b>
        <span>{user.email}</span>
        <time dateTime={user.createdAt}>สมัครเมื่อ {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" }).format(new Date(user.createdAt))}</time>
      </div>
      <span className={`member-role role-${user.role}`}>{roleLabel(user.role)}</span>
      {user.role === "admin"
        ? <small className="member-admin-locked">บัญชีแอดมินไม่สามารถแก้ไขหรือลบได้</small>
        : <MemberActions user={user} />}
    </article>)}
    {!visibleUsers.length && <div className="member-search-empty"><b>ไม่พบบัญชี</b><span>ลองค้นหาด้วยชื่อหรืออีเมลอื่น</span></div>}
    </div>
    {pageCount > 1 && <nav className="catalog-pagination" aria-label="เปลี่ยนหน้ารายชื่อบัญชี">
      <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>← ก่อนหน้า</button>
      <span aria-live="polite">หน้า <b>{currentPage}</b> จาก {pageCount}</span>
      <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pageCount}>ถัดไป →</button>
    </nav>}
  </div>;
}
