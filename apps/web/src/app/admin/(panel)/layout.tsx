import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Загружаем…</p>}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
