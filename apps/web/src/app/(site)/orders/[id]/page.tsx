import { Suspense } from "react";
import { OrderView } from "@/components/order-view";
import { T } from "@/components/t";

export default function OrderStatusPage({ params }: PageProps<"/orders/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <Suspense fallback={<p className="text-muted">
            <T k="common.loading" />
          </p>}>
        <OrderView params={params} />
      </Suspense>
    </main>
  );
}
