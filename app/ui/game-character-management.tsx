"use client";

import { useActionState, useEffect, useRef } from "react";
import { addGameCharacterAction, deleteGameCharacterAction, type GameCharacterState } from "@/app/actions/characters";
import { FormSubmitButton } from "@/app/ui/form-submit-button";
import type { GameCategory, GameCharacter } from "@/lib/types";

const initialState: GameCharacterState = { error: "" };

export function GameCharacterManagement({ categories, characters }: { categories: GameCategory[]; characters: GameCharacter[] }) {
  const [state, action, pending] = useActionState(addGameCharacterAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.success) formRef.current?.reset(); }, [state.success]);

  return <div className="game-character-management">
    <form ref={formRef} action={action} className="product-form game-character-create">
      <div className="field-row">
        <label>ชื่อตัวละคร<input name="name" required maxLength={80} placeholder="เช่น Furina, Shorekeeper" /></label>
        <label>หมวดเกม<select name="categoryId" defaultValue={categories[0]?.id ?? ""} required><option value="" disabled>เลือกหมวดเกม</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
      </div>
      <label>ลำดับการแสดง<input name="sortOrder" type="number" defaultValue={characters.length + 1} /><small className="field-help">ตัวเลขน้อยจะแสดงก่อน</small></label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.success && <p className="form-success" role="status">{state.success}</p>}
      <button className="button button-dark" disabled={pending || !categories.length}>{pending ? "กำลังเพิ่ม..." : "+ เพิ่มชื่อตัวละคร"}</button>
    </form>
    <div className="game-character-list">
      {characters.map((character) => <article key={character.id}><div><b>{character.name}</b><span>{character.categoryName}</span></div><form action={deleteGameCharacterAction} onSubmit={(event) => { if (!window.confirm(`ลบตัวละคร ${character.name} ออกจากระบบใช่หรือไม่? ตัวละครนี้จะถูกนำออกจากสินค้าที่เลือกไว้ด้วย`)) event.preventDefault(); }}><input type="hidden" name="id" value={character.id} /><FormSubmitButton pendingLabel="กำลังลบ...">ลบ</FormSubmitButton></form></article>)}
      {!characters.length && <p>ยังไม่มีรายชื่อตัวละคร เพิ่มรายการแรกจากแบบฟอร์มด้านบนได้เลย</p>}
    </div>
  </div>;
}
