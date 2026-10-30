"use client";

import { useQuery } from "@tanstack/react-query";
import { ORDER_STATUSES, type OrderStatus } from "@wishbook/shared";
import { CheckCircle2, Circle, CreditCard, Home, Printer, Truck } from "lucide-react";
import { use } from "react";
import { getOrder } from "@/lib/api";
import { formatKzt } from "@/lib/format";

const STAGES: Record<OrderStatus, { label: string; icon: typeof Circle }> = {
  paid: { label: "Оплачен", icon: CreditCard },
  printing: { label: "Передан в типографию", icon: Printer },
  shipped: { label: "В пути", icon: Truck },
  delivered: { label: "Доставлен", icon: Home },
};

export function OrderView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, error } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrder(id),
    refetchInterval: (query) => (query.state.data?.status === "delivered" ? false : 2000),
  });

  if (error) return <p role="alert" className="text-red-600">{error.message}</p>;
  if (!order) return <p className="text-muted">Загружаем…</p>;

  const current = ORDER_STATUSES.indexOf(order.status);
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold">Заказ оформлен</h1>
        <p className="text-muted">
          «{order.bookTitle}», {order.quantity} шт., {order.cover === "hard" ? "твёрдая" : "мягкая"} обложка
        </p>
      </header>

      <ol data-testid="order-status" data-status={order.status} className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-6">
        {ORDER_STATUSES.map((status, index) => {
          const { label, icon: Icon } = STAGES[status];
          const done = index <= current;
          return (
            <li key={status} className={`flex items-center gap-3 ${done ? "font-bold" : "text-muted"}`}>
              {done ? <CheckCircle2 className="size-5 text-accent" /> : <Circle className="size-5" />}
              <Icon className="size-5" />
              {label}
            </li>
          );
        })}
      </ol>

      <section className="flex flex-col gap-1 rounded-2xl bg-card p-5">
        <span>
          {order.recipientName}, {order.city}, {order.address}
        </span>
        <span className="text-lg font-extrabold">Итого: {formatKzt(order.totalKzt)}</span>
      </section>
      <p className="text-center text-xs text-muted">Демо: оплата не списывалась, статусы доставки меняются для примера.</p>
    </div>
  );
}
