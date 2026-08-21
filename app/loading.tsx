export default function Loading() {
  return <main className="page-loading" role="status" aria-live="polite" aria-label="กำลังโหลดหน้า">
    <div className="page-loading-spinner" aria-hidden="true"><i /><i /><i /></div>
    <strong>กำลังโหลด</strong>
    <span>โปรดรอสักครู่...</span>
  </main>;
}
