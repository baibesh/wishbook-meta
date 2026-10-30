const kzt = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

/** 14900 → "14 900 ₸" */
export function formatKzt(amount: number): string {
  return `${kzt.format(amount)} ₸`;
}
