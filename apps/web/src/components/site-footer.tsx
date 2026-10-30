"use client";

import Link from "next/link";
import { setCountry, useI18n, type Country } from "@/i18n/i18n";
import { Logo } from "./logo";

export function SiteFooter() {
  const { t, country } = useI18n();
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <Logo className="text-foreground" />
          <span>{t("footer.tagline")}</span>
        </div>
        <nav className="flex flex-wrap items-center gap-4">
          <Link href="/privacy" className="hover:text-foreground">
            {t("footer.privacy")}
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            {t("footer.terms")}
          </Link>
          <a href="mailto:hello@fabulka.com" className="hover:text-foreground">
            hello@fabulka.com
          </a>
          {/* On phones the header has no room for the country switch. */}
          <select
            aria-label={t("nav.country")}
            className="rounded-lg border border-border bg-transparent px-2 py-1 sm:hidden"
            value={country}
            onChange={(e) => setCountry(e.target.value as Country)}
          >
            <option value="KZ">{t("country.KZ")}</option>
            <option value="other">{t("country.other")}</option>
          </select>
        </nav>
      </div>
    </footer>
  );
}
