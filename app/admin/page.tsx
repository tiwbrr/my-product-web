import Link from "next/link";
import { deleteProductAction } from "@/app/actions/products";
import { deleteGameCategoryAction, updateGameCategoryIconAction } from "@/app/actions/categories";
import { logoutAction } from "@/app/actions/auth";
import { ContactSettingsForm } from "@/app/ui/contact-settings-form";
import { AdminNav } from "@/app/ui/admin-nav";
import { FormSubmitButton } from "@/app/ui/form-submit-button";
import { PaginatedList } from "@/app/ui/paginated-list";
import { GameCategoryForm } from "@/app/ui/game-category-form";
import { GameCharacterManagement } from "@/app/ui/game-character-management";
import { HeroMediaSettingsForm } from "@/app/ui/hero-media-settings-form";
import { ProductForm } from "@/app/ui/product-form";
import { MemberManagement } from "@/app/ui/member-management";
import { XOSettingsForm } from "@/app/ui/xo-settings-form";
import { requireStaff } from "@/lib/auth";
import { getGameCategories, getGameCharacters, getProducts, getStoreSettings, getUserCount, getUsers } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireStaff();
  const [products, users, userCount, settings, categories, characters] = await Promise.all([
    getProducts(),
    admin.role === "admin" ? getUsers() : Promise.resolve([]),
    getUserCount(),
    getStoreSettings(),
    getGameCategories(),
    getGameCharacters(),
  ]);
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  return <main className="admin-shell">
    <aside className="admin-sidebar">
      <Link href="/" className="brand brand-light"><span>K</span> KUOZO SHOP</Link>
      <div className="admin-label">ADMIN CONSOLE</div>
      <AdminNav canManageUsers={admin.role === "admin"} />
      <div className="admin-profile"><div>{admin.name.charAt(0)}</div><span><b>{admin.name}</b><small>{admin.email}</small></span></div>
      <form action={logoutAction}><FormSubmitButton pendingLabel="กำลังออกจากระบบ...">ออกจากระบบ →</FormSubmitButton></form>
    </aside>
    <div className="admin-main">
      <header className="admin-top"><div><span className="eyebrow">KUOZO SHOP MANAGEMENT</span><h1>สวัสดี, {admin.name}</h1><p>จัดการไอดีเกม หมวดเกม ช่องทางติดต่อ Playlist และเสียงแจ้งเตือนได้จากที่นี่</p></div><Link href="/" className="button button-outline">ดูหน้าร้าน ↗</Link></header>
      <section className="stats-grid" id="overview"><article><span>ไอดีทั้งหมด</span><strong>{products.length}</strong><small>รายการในร้าน</small></article><article><span>ไอดีพร้อมจำหน่าย</span><strong>{totalStock}</strong><small>ชิ้นพร้อมขาย</small></article><article><span>บัญชีทั้งหมด</span><strong>{userCount}</strong><small>สมาชิกและทีมงานของร้าน</small></article></section>
      {admin.role === "admin" && <section className="admin-panel" id="members">
        <div className="panel-heading"><div><span className="panel-icon">♙</span><span><h2>จัดการสมาชิก</h2><p>ดูบัญชีทั้งหมด กำหนดสิทธิ์ผู้ดูแลร้าน หรือลบบัญชีสมาชิก</p></span></div></div>
        <div className="member-role-guide"><span><i className="role-admin">แอดมิน</i> จัดการร้าน สิทธิ์ และบัญชีทั้งหมด</span><span><i className="role-manager">ผู้ดูแลร้าน</i> จัดการร้านได้ แต่จัดการบัญชีไม่ได้</span><span><i className="role-user">สมาชิก</i> ใช้งานหน้าร้าน แชท และระบบสมาชิก</span></div>
        <MemberManagement users={users} currentUserId={admin.id} />
      </section>}
      <section className="admin-panel" id="hero-media"><div className="panel-heading"><div><span className="panel-icon">▣</span><span><h2>พื้นหลังหน้าแรก</h2><p>อัปโหลดภาพหรือวิดีโอสำหรับฉากหลังส่วนบนของหน้าร้าน</p></span></div></div><HeroMediaSettingsForm settings={settings} /></section>
      <section className="admin-panel" id="mini-game"><div className="panel-heading"><div><span className="panel-icon">XO</span><span><h2>มินิเกม X-O</h2><p>เปิดหรือปิดโหมดเล่นกับบอทและห้องแข่งขันออนไลน์ทั้งหมด</p></span></div></div><XOSettingsForm enabled={settings.xoGameEnabled} /></section>
      <section className="admin-panel" id="contacts"><div className="panel-heading"><div><span className="panel-icon">◎</span><span><h2>ช่องทางติดต่อ Playlist และเสียงแจ้งเตือน</h2><p>จัดการช่องทางติดต่อ เพลย์ลิสต์หน้าร้าน และเสียงข้อความใหม่ได้จากที่เดียว</p></span></div></div><ContactSettingsForm settings={settings} /></section>
      <section className="admin-panel" id="categories"><div className="panel-heading"><div><span className="panel-icon">●</span><span><h2>หมวดหมู่เกม</h2><p>เพิ่มเกมใหม่และอัปโหลดไอคอนวงกลมสำหรับหน้าร้าน</p></span></div></div><GameCategoryForm /><div className="admin-category-list">{categories.map((category) => <article key={category.id}>{category.icon ? <img src={category.icon} alt="" /> : <span>{category.name.charAt(0)}</span>}<b>{category.name}</b>{category.id.includes("-") && category.id.length > 20 && <><form action={updateGameCategoryIconAction} className="category-icon-form"><input type="hidden" name="id" value={category.id} /><label>เลือกรูป<input name="icon" type="file" accept="image/jpeg,image/png,image/webp" required /></label><FormSubmitButton pendingLabel="กำลังเปลี่ยน...">เปลี่ยนไอคอน</FormSubmitButton></form><form action={deleteGameCategoryAction}><input type="hidden" name="id" value={category.id} /><FormSubmitButton pendingLabel="กำลังลบ..." ariaLabel={`ลบหมวด ${category.name}`}>ลบหมวด</FormSubmitButton></form></>}</article>)}</div></section>
      <section className="admin-panel" id="characters"><div className="panel-heading"><div><span className="panel-icon">♟</span><span><h2>รายชื่อตัวละคร</h2><p>เพิ่มตัวละครแยกตามเกม เพื่อใช้เลือกในสินค้าและตัวกรองหน้าร้าน</p></span></div></div><GameCharacterManagement categories={categories} characters={characters} /></section>
      <section className="admin-panel" id="add-product"><div className="panel-heading"><div><span className="panel-icon">＋</span><span><h2>เพิ่มไอดีเกมใหม่</h2><p>กรอกรายละเอียด เลือกตัวละคร และเลือกรูปภาพได้หลายรูป</p></span></div></div><ProductForm categories={categories} characters={characters} /></section>
      <section className="inventory-section" id="inventory">
        <div className="section-heading admin-section-heading"><div><span className="eyebrow">ID INVENTORY</span><h2>รายการไอดีเกม</h2></div><p>{products.length} รายการ</p></div>
        {!!products.length && <PaginatedList listClassName="inventory-list" itemLabel="รายการสินค้า">{products.map((product) => <details className="inventory-item" key={product.id}>
          <summary><div className="inventory-thumb">{product.images[0] ? <img src={product.images[0]} alt="" /> : <span>{product.name.charAt(0)}</span>}</div><div className="inventory-name"><b>{product.name}</b><small>{product.category} · {product.accountGender === "male" ? "หลักชาย" : product.accountGender === "female" ? "หลักหญิง" : "ยังไม่ระบุ"} · {product.characterIds.length} ตัวละคร · {product.images.length} รูป · รหัส {product.id.slice(0, 8)}</small></div><strong>฿{product.price.toLocaleString("th-TH")}</strong><span className={product.stock ? "stock-ok" : "stock-out"}>{product.stock ? `${product.stock} ชิ้น` : "สินค้าหมด"}</span><i>แก้ไข⌄</i></summary>
          <div className="inventory-edit"><ProductForm product={product} categories={categories} characters={characters} compact /><form action={deleteProductAction}><input type="hidden" name="id" value={product.id} /><FormSubmitButton className="delete-product" pendingLabel="กำลังลบ...">ลบไอดีนี้ออกจากร้าน</FormSubmitButton></form></div>
        </details>)}</PaginatedList>}
        {!products.length && <div className="empty-state"><h3>ยังไม่มีสินค้า</h3><p>เพิ่มสินค้าชิ้นแรกจากฟอร์มด้านบนได้เลย</p></div>}
      </section>
    </div>
  </main>;
}
