import type { UiLocale } from "@/i18n/messages";

/** Cities we deliver to. The Russian name is the value the API prices by; the rest are labels. */
export const CITIES: { ru: string; kk: string; en: string }[] = [
  { ru: "Алматы", kk: "Алматы", en: "Almaty" },
  { ru: "Астана", kk: "Астана", en: "Astana" },
  { ru: "Шымкент", kk: "Шымкент", en: "Shymkent" },
  { ru: "Караганда", kk: "Қарағанды", en: "Karaganda" },
  { ru: "Актобе", kk: "Ақтөбе", en: "Aktobe" },
  { ru: "Тараз", kk: "Тараз", en: "Taraz" },
  { ru: "Павлодар", kk: "Павлодар", en: "Pavlodar" },
  { ru: "Усть-Каменогорск", kk: "Өскемен", en: "Oskemen" },
  { ru: "Атырау", kk: "Атырау", en: "Atyrau" },
  { ru: "Костанай", kk: "Қостанай", en: "Kostanay" },
];

export function cityName(value: string, locale: UiLocale): string {
  return CITIES.find((c) => c.ru === value)?.[locale] ?? value;
}
