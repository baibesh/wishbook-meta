"use client";

import { BookHeart, Globe, Library, MapPin, Wand2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { setCountry, setLocale, useI18n, type Country } from "@/i18n/i18n";
import { LOCALE_NAMES, UI_LOCALES, type MessageKey, type UiLocale } from "@/i18n/messages";
import { Logo } from "./logo";

const NAV: { href: string; label: MessageKey; icon: typeof Library; testId: string }[] = [
  { href: "/", label: "nav.catalog", icon: Library, testId: "nav-catalog" },
  { href: "/create", label: "nav.create", icon: Wand2, testId: "nav-create" },
  { href: "/my", label: "nav.my", icon: BookHeart, testId: "nav-my" },
];

const select =
  "cursor-pointer appearance-none rounded-lg bg-transparent py-1 pr-1 pl-6 text-sm font-semibold text-muted outline-none hover:text-foreground";

export function SiteHeader() {
  const pathname = usePathname();
  const { t, locale, country } = useI18n();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-2 px-4">
        <Link href="/" aria-label={t("nav.home")} className="mr-auto">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon, testId }) => {
            const active = href === "/" ? pathname === "/" || pathname.startsWith("/catalog") : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                data-testid={testId}
                aria-label={t(label)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold ${
                  active ? "bg-accent/15 text-accent" : "text-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                <span className="hidden md:inline">{t(label)}</span>
              </Link>
            );
          })}
        </nav>
        <label className="relative flex items-center" title={t("nav.language")}>
          <Globe className="pointer-events-none absolute left-1 size-4 text-muted" />
          <select
            data-testid="ui-language"
            aria-label={t("nav.language")}
            className={select}
            value={locale}
            onChange={(e) => setLocale(e.target.value as UiLocale)}
          >
            {UI_LOCALES.map((l) => (
              <option key={l} value={l}>
                {l === "kk" ? "ҚАЗ" : l.toUpperCase()} · {LOCALE_NAMES[l]}
              </option>
            ))}
          </select>
        </label>
        <label className="relative hidden items-center sm:flex" title={t("nav.country")}>
          <MapPin className="pointer-events-none absolute left-1 size-4 text-muted" />
          <select
            data-testid="ui-country"
            aria-label={t("nav.country")}
            className={select}
            value={country}
            onChange={(e) => setCountry(e.target.value as Country)}
          >
            <option value="KZ">{t("country.KZ")}</option>
            <option value="other">{t("country.other")}</option>
          </select>
        </label>
      </div>
    </header>
  );
}
