import Link from "next/link";
import { deleteProductAction } from "@/app/actions/products";
import { deleteGameCategoryAction, updateGameCategoryIconAction } from "@/app/actions/categories";
import { logoutAction } from "@/app/actions/auth";
import { ContactSettingsForm } from "@/app/ui/contact-settings-form";
import { GameCategoryForm } from "@/app/ui/game-category-form";
import { ProductForm } from "@/app/ui/product-form";
import { getMemberCount, requireAdmin } from "@/lib/auth";
import { getGameCategories, getProducts, getStoreSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [admin, products, members, settings, categories] = await Promise.all([
    requireAdmin(),
    getProducts(),
    getMemberCount(),
    getStoreSettings(),
    getGameCategories(),
  ]);
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  return <main className="admin-shell">
    <aside className="admin-sidebar">
      <Link href="/" className="brand brand-light"><span>K</span> KUOZO SHOP</Link>
      <div className="admin-label">ADMIN CONSOLE</div>
      <nav>
        <a href="#overview" className="active"><span>⌂</span> ภาพรวม</a>
        <a href="#contacts"><span>◎</span> ติดต่อ Playlist และเสียง</a>
        <a href="#categories"><span>●</span> หมวดเกม</a>
        <a href="#add-product"><span>＋</span> เพิ่มสินค้า</a>
        <a href="#inventory"><span>□</span> รายการสินค้า</a>
        <Link href="/"><span>↗</span> ดูหน้าร้าน</Link>
      </nav>
      <div className="admin-profile"><div>{admin.name.charAt(0)}</div><span><b>{admin.name}</b><small>{admin.email}</small></span></div>
      <form action={logoutAction}><button>ออกจากระบบ →</button></form>
    </aside>
    <div className="admin-main">
      <header className="admin-top"><div><span className="eyebrow">KUOZO SHOP MANAGEMENT</span><h1>สวัสดี, {admin.name}</h1><p>จัดการไอดีเกม หมวดเกม ช่องทางติดต่อ Playlist และเสียงแจ้งเตือนได้จากที่นี่</p></div><Link href="/" className="button button-outline">ดูหน้าร้าน ↗</Link></header>
      <section className="stats-grid" id="overview"><article><span>ไอดีทั้งหมด</span><strong>{products.length}</strong><small>รายการในร้าน</small></article><article><span>ไอดีพร้อมจำหน่าย</span><strong>{totalStock}</strong><small>ชิ้นพร้อมขาย</small></article><article><span>สมาชิกทั่วไป</span><strong>{members}</strong><small>บัญชีที่สมัครแล้ว</small></article></section>
      <section className="admin-panel" id="contacts"><div className="panel-heading"><div><span className="panel-icon">◎</span><span><h2>ช่องทางติดต่อ Playlist และเสียงแจ้งเตือน</h2><p>จัดการช่องทางติดต่อ เพลย์ลิสต์หน้าร้าน และเสียงข้อความใหม่ได้จากที่เดียว</p></span></div></div><ContactSettingsForm settings={settings} /></section>
      <section className="admin-panel" id="categories"><div className="panel-heading"><div><span className="panel-icon">●</span><span><h2>หมวดหมู่เกม</h2><p>เพิ่มเกมใหม่และอัปโหลดไอคอนวงกลมสำหรับหน้าร้าน</p></span></div></div><GameCategoryForm /><div className="admin-category-list">{categories.map((category) => <article key={category.id}>{category.icon ? <img src={category.icon} alt="" /> : <span>{category.name.charAt(0)}</span>}<b>{category.name}</b>{category.id.includes("-") && category.id.length > 20 && <><form action={updateGameCategoryIconAction} className="category-icon-form"><input type="hidden" name="id" value={category.id} /><label>เลือกรูป<input name="icon" type="file" accept="image/jpeg,image/png,image/webp" required /></label><button>เปลี่ยนไอคอน</button></form><form action={deleteGameCategoryAction}><input type="hidden" name="id" value={category.id} /><button aria-label={`ลบหมวด ${category.name}`}>ลบหมวด</button></form></>}</article>)}</div></section>
      <section className="admin-panel" id="add-product"><div className="panel-heading"><div><span className="panel-icon">＋</span><span><h2>เพิ่มไอดีเกมใหม่</h2><p>กรอกรายละเอียดและเลือกรูปภาพได้หลายรูป</p></span></div></div><ProductForm categories={categories} /></section>
      <section className="inventory-section" id="inventory">
        <div className="section-heading admin-section-heading"><div><span className="eyebrow">ID INVENTORY</span><h2>รายการไอดีเกม</h2></div><p>{products.length} รายการ</p></div>
        <div className="inventory-list">{products.map((product) => <details className="inventory-item" key={product.id}>
          <summary><div className="inventory-thumb">{product.images[0] ? <img src={product.images[0]} alt="" /> : <span>{product.name.charAt(0)}</span>}</div><div className="inventory-name"><b>{product.name}</b><small>{product.category} · {product.accountGender === "male" ? "หลักชาย" : product.accountGender === "female" ? "หลักหญิง" : "ยังไม่ระบุ"} · {product.images.length} รูป · รหัส {product.id.slice(0, 8)}</small></div><strong>฿{product.price.toLocaleString("th-TH")}</strong><span className={product.stock ? "stock-ok" : "stock-out"}>{product.stock ? `${product.stock} ชิ้น` : "สินค้าหมด"}</span><i>แก้ไข⌄</i></summary>
          <div className="inventory-edit"><ProductForm product={product} categories={categories} compact /><form action={deleteProductAction}><input type="hidden" name="id" value={product.id} /><button className="delete-product">ลบไอดีนี้ออกจากร้าน</button></form></div>
        </details>)}</div>
        {!products.length && <div className="empty-state"><h3>ยังไม่มีสินค้า</h3><p>เพิ่มสินค้าชิ้นแรกจากฟอร์มด้านบนได้เลย</p></div>}
      </section>
    </div>
  </main>;
}
