import type { BookStatus, OrderStatus } from "@wishbook/shared";
import type { ReactNode } from "react";

export const BOOK_STATUS: Record<BookStatus, { label: string; tone: string }> = {
  queued: { label: "В очереди", tone: "bg-border text-muted" },
  toy: { label: "Игрушка", tone: "bg-amber-500/15 text-amber-600" },
  story: { label: "Сказка", tone: "bg-amber-500/15 text-amber-600" },
  hero: { label: "Герой", tone: "bg-amber-500/15 text-amber-600" },
  pages: { label: "Страницы", tone: "bg-amber-500/15 text-amber-600" },
  pdf: { label: "PDF", tone: "bg-amber-500/15 text-amber-600" },
  done: { label: "Готова", tone: "bg-emerald-500/15 text-emerald-600" },
  failed: { label: "Ошибка", tone: "bg-red-500/15 text-red-600" },
};

export const ORDER_STATUS: Record<OrderStatus, string> = {
  paid: "Оплачен",
  printing: "Печатается",
  shipped: "Отправлен",
  delivered: "Доставлен",
};

export function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${tone}`}>{children}</span>;
}

export function Card({ title, action, children, className = "" }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3">
          {title && <h2 className="font-bold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-extrabold">{children}</h1>
      {aside}
    </div>
  );
}

export const table = "w-full text-left text-sm [&_td]:px-3 [&_td]:py-2.5 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_th]:text-muted [&_tbody_tr]:border-t [&_tbody_tr]:border-border";
export const input = "w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-accent";
export const button = "rounded-xl bg-accent px-4 py-2 font-bold text-accent-foreground disabled:opacity-50";
export const ghostButton = "rounded-xl border border-border px-4 py-2 font-semibold hover:border-accent disabled:opacity-50";

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export const formatUsd = (usd: number) => `$${usd.toFixed(usd < 1 ? 3 : 2)}`;
