"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ORDER_STATUSES, type OrderStatus } from "@fabulka/shared";
import Link from "next/link";
import { useState } from "react";
import { adminOrders, setOrderStatus } from "@/lib/admin-api";
import { formatKzt } from "@/lib/format";
import { formatDate, input, ORDER_STATUS, PageTitle, table } from "./ui";

export function OrdersTable() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<OrderStatus | "">("");
  const orders = useQuery({ queryKey: ["admin", "orders"], queryFn: adminOrders, refetchInterval: 10_000 });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => setOrderStatus(id, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });

  return (
    <>
      <PageTitle
        aside={
          <select data-testid="orders-filter" className={`${input} w-48`} value={filter} onChange={(e) => setFilter(e.target.value as OrderStatus | "")}>
            <option value="">Все статусы</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS[s]}
              </option>
            ))}
          </select>
        }
      >
        Заказы печати
      </PageTitle>
      {orders.isError && <p role="alert" className="text-red-600">{orders.error.message}</p>}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table data-testid="orders-table" className={table}>
          <thead>
            <tr>
              <th>Книга</th>
              <th>Получатель</th>
              <th>Адрес</th>
              <th>Обложка</th>
              <th className="text-right">Сумма</th>
              <th>Статус</th>
              <th>Создан</th>
            </tr>
          </thead>
          <tbody>
            {orders.data?.filter((o) => !filter || o.status === filter).map((order) => (
              <tr key={order.id} data-testid="order-row">
                <td>
                  <Link href={`/admin/books/${order.bookId}`} className="font-semibold hover:text-accent">
                    {order.bookTitle ?? "Без названия"}
                  </Link>
                </td>
                <td>
                  {order.recipientName}
                  <div className="text-xs text-muted">{order.phone}</div>
                </td>
                <td className="min-w-48">
                  {order.city}
                  <div className="text-xs text-muted">{order.address}</div>
                </td>
                <td className="whitespace-nowrap">
                  {order.cover === "hard" ? "Твёрдая" : "Мягкая"} × {order.quantity}
                </td>
                <td className="text-right tabular-nums">{formatKzt(order.totalKzt)}</td>
                <td>
                  <select
                    data-testid="order-status-select"
                    className={`${input} w-36 py-1`}
                    value={order.status}
                    disabled={update.isPending}
                    onChange={(e) => update.mutate({ id: order.id, status: e.target.value as OrderStatus })}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS[s]}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-muted">{order.manual ? "вручную" : "по таймеру демо"}</div>
                </td>
                <td className="whitespace-nowrap text-muted">{formatDate(order.createdAt)}</td>
              </tr>
            ))}
            {orders.data?.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted">
                  Заказов пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
