import Link from "next/link";
import { Suspense } from "react";
import { OrderForm } from "@/components/order-form";

export default function OrderPage({ params }: PageProps<"/books/[id]/order">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <Suspense fallback={<p className="text-muted">Загружаем…</p>}>
        <BackLink params={params} />
        <OrderForm params={params} />
      </Suspense>
    </main>
  );
}

async function BackLink({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Link href={`/books/${id}`} className="text-sm font-semibold text-accent">
      ← К книге
    </Link>
  );
}
