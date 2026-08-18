"use client";

import { useActionState, useEffect, useRef } from "react";
import { addGameCategoryAction, type CategoryState } from "@/app/actions/categories";

const initialState: CategoryState = { error: "" };

export function GameCategoryForm() {
  const [state, formAction, pending] = useActionState(addGameCategoryAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.success) formRef.current?.reset(); }, [state.success]);
  return <form ref={formRef} action={formAction} className="product-form category-form">
    <div className="field-row"><label>ชื่อเกม<input name="name" placeholder="เช่น Honkai: Star Rail" required minLength={2} /></label><label className="file-field"><span>ไอคอนหมวดเกม <small>แนะนำรูปสี่เหลี่ยมจัตุรัส</small></span><input name="icon" type="file" accept="image/jpeg,image/png,image/webp" /><i>ระบบจะแสดงเป็นไอคอนวงกลม</i></label></div>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    {state.success && <p className="form-success" role="status">{state.success}</p>}
    <button className="button button-dark" disabled={pending}>{pending ? "กำลังเพิ่ม..." : "+ เพิ่มหมวดเกม"}</button>
  </form>;
}
