"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminStats } from "@wishbook/shared";
import { Pause, Play } from "lucide-react";
import { adminStats, setPaused } from "@/lib/admin-api";
import { formatKzt } from "@/lib/format";
import { Card, formatUsd, PageTitle } from "./ui";

const regionName = new Intl.DisplayNames(["ru"], { type: "region" });

function Stat({ label, value, hint, testId }: { label: string; value: string; hint?: string; testId?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-5">
      <span className="text-sm text-muted">{label}</span>
      <span data-testid={testId} className="text-3xl font-extrabold tabular-nums">
        {value}
      </span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

function Meter({ label, used, limit, format = String }: { label: string; used: number; limit: number; format?: (n: number) => string }) {
  const share = limit ? Math.min(used / limit, 1) : 0;
  const tone = share >= 0.9 ? "bg-red-500" : share >= 0.7 ? "bg-amber-500" : "bg-accent";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-muted">
          {format(used)} из {format(limit)}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-border">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${share * 100}%` }} />
      </div>
    </div>
  );
}

function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  if (!rows.length) return <p className="text-sm text-muted">Пока нет данных</p>;
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li key={row.label} className="grid grid-cols-[minmax(0,10rem)_1fr_2.5rem] items-center gap-3 text-sm">
          <span className="truncate">{row.label}</span>
          <span className="h-2.5 rounded-full bg-accent/80" style={{ width: `${(row.value / max) * 100}%` }} />
          <span className="text-right tabular-nums text-muted">{row.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function Dashboard() {
  const queryClient = useQueryClient();
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: adminStats, refetchInterval: 10_000 });
  const pause = useMutation({
    mutationFn: setPaused,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] }),
  });

  if (stats.isError) return <p role="alert" className="text-red-600">{stats.error.message}</p>;
  if (!stats.data) return <p className="text-muted">Загружаем…</p>;
  const s: AdminStats = stats.data;
  const success = s.books.successRate === null ? "—" : `${Math.round(s.books.successRate * 100)}%`;
  const avg = s.books.avgSeconds === null ? "—" : `${Math.round(s.books.avgSeconds)} с`;

  return (
    <>
      <PageTitle>Дашборд</PageTitle>

      <section
        data-testid="pause-card"
        data-paused={s.paused}
        className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5 ${
          s.paused ? "border-red-500/40 bg-red-500/10" : "border-border bg-card"
        }`}
      >
        <div>
          <p className="font-bold">{s.paused ? "Генерация на паузе" : "Генерация работает"}</p>
          <p className="text-sm text-muted">
            {s.paused ? "Новые книги не создаются, начатые доделываются." : "Пауза останавливает новые книги, если бюджет или нагрузка выходят из-под контроля."}
          </p>
        </div>
        <button
          type="button"
          data-testid="pause-toggle"
          disabled={pause.isPending}
          onClick={() => pause.mutate(!s.paused)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 font-bold disabled:opacity-50 ${
            s.paused ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {s.paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          {s.paused ? "Возобновить" : "Поставить на паузу"}
        </button>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Книг сегодня" value={String(s.books.today)} hint={`всего ${s.books.total}`} testId="stat-books-today" />
        <Stat label="Успешных" value={success} hint={`ошибок: ${s.books.byStatus.failed ?? 0}`} />
        <Stat label="Время генерации" value={avg} hint="в среднем, до готового PDF" />
        <Stat label="Расход Meta" value={formatUsd(s.spend.totalUsd)} hint={`сегодня ${formatUsd(s.spend.todayUsd)}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Бюджет и лимиты">
          <Meter label="Бюджет на модели" used={s.spend.totalUsd} limit={s.spend.budgetUsd} format={formatUsd} />
          <Meter label="Книги сегодня" used={s.caps.regular.used} limit={s.caps.regular.limit} />
          <Meter label="Демо-книги сегодня" used={s.caps.demo.used} limit={s.caps.demo.limit} />
        </Card>
        <Card title="Продажи (демо-оплата)">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted">Покупки PDF</p>
              <p className="text-2xl font-extrabold tabular-nums">{s.sales.purchases}</p>
              <p className="text-xs text-muted">{formatKzt(s.sales.purchasesKzt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Заказы печати</p>
              <p className="text-2xl font-extrabold tabular-nums">{s.sales.orders}</p>
              <p className="text-xs text-muted">{formatKzt(s.sales.ordersKzt)}</p>
            </div>
          </div>
        </Card>
        <Card title="Спрос по странам">
          <Bars rows={s.countries.map((c) => ({ label: regionName.of(c.country) ?? c.country, value: c.books }))} />
        </Card>
        <Card title="Популярные книги">
          <Bars rows={s.templates.map((t) => ({ label: t.title, value: t.books }))} />
        </Card>
      </div>
    </>
  );
}
