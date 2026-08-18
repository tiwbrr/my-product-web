import Link from "next/link";
import { deleteProductAction } from "@/app/actions/products";
import { logoutAction } from "@/app/actions/auth";
import { ContactSettingsForm } from "@/app/ui/contact-settings-form";
import { ProductForm } from "@/app/ui/product-form";
import { getMemberCount, requireAdmin } from "@/lib/auth";
import { getProducts, getStoreSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [admin, products, members, settings] = await Promise.all([
    requireAdmin(),
    getProducts(),
    getMemberCount(),
    getStoreSettings(),
  ]);
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  return <main className="admin-shell">
    <aside className="admin-sidebar">
      <Link href="/" className="brand brand-light"><span>M</span> XXXXXXXX</Link>
      <div className="admin-label">ADMIN CONSOLE</div>
      <nav>
        <a href="#overview" className="active"><span>⌂</span> ภาพรวม</a>
        <a href="#contacts"><span>◎</span> ช่องทางติดต่อ</a>
        <a href="#add-product"><span>＋</span> เพิ่มสินค้า</a>
        <a href="#inventory"><span>□</span> รายการสินค้า</a>
        <Link href="/"><span>↗</span> ดูหน้าร้าน</Link>
      </nav>
      <div className="admin-profile"><div>{admin.name.charAt(0)}</div><span><b>{admin.name}</b><small>{admin.email}</small></span></div>
      <form action={logoutAction}><button>ออกจากระบบ →</button></form>
    </aside>
    <div className="admin-main">
      <header className="admin-top"><div><span className="eyebrow">XXXXXXXXXXX</span><h1>สวัสดี, {admin.name}</h1><p>จัดการสินค้าและช่องทางติดต่อได้จากที่นี่</p></div><Link href="/" className="button button-outline">ดูหน้าร้าน ↗</Link></header>
      <section className="stats-grid" id="overview"><article><span>สินค้าทั้งหมด</span><strong>{products.length}</strong><small>รายการในร้าน</small></article><article><span>สินค้าคงเหลือ</span><strong>{totalStock}</strong><small>ชิ้นพร้อมจำหน่าย</small></article><article><span>สมาชิกทั่วไป</span><strong>{members}</strong><small>บัญชีที่สมัครแล้ว</small></article></section>
      <section className="admin-panel" id="contacts"><div className="panel-heading"><div><span className="panel-icon">◎</span><span><h2>ช่องทางติดต่อ</h2><p>จัดการ LINE QR Code และลิงก์ Facebook ที่แสดงหน้าร้าน</p></span></div></div><ContactSettingsForm settings={settings} /></section>
      <section className="admin-panel" id="add-product"><div className="panel-heading"><div><span className="panel-icon">＋</span><span><h2>เพิ่มสินค้าใหม่</h2><p>กรอกรายละเอียดและเลือกรูปภาพสินค้าได้หลายรูป</p></span></div></div><ProductForm /></section>
      <section className="inventory-section" id="inventory">
        <div className="section-heading admin-section-heading"><div><span className="eyebrow">INVENTORY</span><h2>รายการสินค้า</h2></div><p>{products.length} รายการ</p></div>
        <div className="inventory-list">{products.map((product) => <details className="inventory-item" key={product.id}>
          <summary><div className="inventory-thumb">{product.images[0] ? <img src={product.images[0]} alt="" /> : <span>{product.name.charAt(0)}</span>}</div><div className="inventory-name"><b>{product.name}</b><small>{product.category} · {product.images.length} รูป · รหัส {product.id.slice(0, 8)}</small></div><strong>฿{product.price.toLocaleString("th-TH")}</strong><span className={product.stock ? "stock-ok" : "stock-out"}>{product.stock ? `${product.stock} ชิ้น` : "สินค้าหมด"}</span><i>แก้ไข⌄</i></summary>
          <div className="inventory-edit"><ProductForm product={product} compact /><form action={deleteProductAction}><input type="hidden" name="id" value={product.id} /><button className="delete-product">ลบสินค้านี้ออกจากร้าน</button></form></div>
        </details>)}</div>
        {!products.length && <div className="empty-state"><h3>ยังไม่มีสินค้า</h3><p>เพิ่มสินค้าชิ้นแรกจากฟอร์มด้านบนได้เลย</p></div>}
      </section>
    </div>
  </main>;
}
