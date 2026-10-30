"use client";

import { useSyncExternalStore } from "react";
import { MESSAGES, UI_LOCALES, type MessageKey, type UiLocale } from "./messages";

const LOCALE_KEY = "fabulka.locale";
const COUNTRY_KEY = "fabulka.country";
const CHANGE = "fabulka:settings";

/** Countries Fabulka prints and prices for; everywhere else gets the PDF in dollars. */
export type Country = "KZ" | "other";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode: the choice lasts until the page closes.
  }
  window.dispatchEvent(new Event(CHANGE));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The saved choice, else the browser's language, else Russian. */
function currentLocale(): UiLocale {
  const saved = read(LOCALE_KEY);
  if (saved && (UI_LOCALES as readonly string[]).includes(saved)) return saved as UiLocale;
  const browser = navigator.language.slice(0, 2);
  return (UI_LOCALES as readonly string[]).includes(browser) ? (browser as UiLocale) : "ru";
}

export function setLocale(locale: UiLocale) {
  write(LOCALE_KEY, locale);
  document.documentElement.lang = locale;
}

export function setCountry(country: Country) {
  write(COUNTRY_KEY, country);
}

/** Whether the visitor has picked a country yet (otherwise it is detected once). */
export const countryChosen = () => read(COUNTRY_KEY) !== null;

function format(text: string, vars?: Record<string, string | number>) {
  return vars ? text.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`)) : text;
}

/** Interface language and country. Pages render in Russian on the server, then switch. */
export function useI18n() {
  const locale = useSyncExternalStore(subscribe, currentLocale, () => "ru" as UiLocale);
  const country = useSyncExternalStore(subscribe, () => (read(COUNTRY_KEY) === "other" ? "other" : "KZ") as Country, () => "KZ" as Country);
  const t = (key: MessageKey, vars?: Record<string, string | number>) => format(MESSAGES[locale][key], vars);
  return { locale, country, t };
}
