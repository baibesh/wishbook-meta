import type { Currency } from "@fabulka/shared";

const kzt = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

/** 14900 → "14 900 ₸" */
export function formatKzt(amount: number): string {
  return `${kzt.format(amount)} ₸`;
}

/** 5.9 → "$5.90" */
export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/** A price in its own currency: "1 900 ₸" or "$3.90". */
export function formatPrice({ amount, currency }: { amount: number; currency: Currency }): string {
  return currency === "KZT" ? formatKzt(amount) : formatUsd(amount);
}
