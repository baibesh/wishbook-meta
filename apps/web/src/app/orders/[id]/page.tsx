import Link from "next/link";
import { Suspense } from "react";
import { OrderView } from "@/components/order-view";

export default function OrderStatusPage({ params }: PageProps<"/orders/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <Link href="/" className="text-sm font-semibold text-accent">
        ← Новая книга
      </Link>
      <Suspense fallback={<p className="text-muted">Загружаем…</p>}>
        <OrderView params={params} />
      </Suspense>
    </main>
  );
}
