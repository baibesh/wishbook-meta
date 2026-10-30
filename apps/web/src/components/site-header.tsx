"use client";

import { BookHeart, Library, Wand2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";

const NAV = [
  { href: "/", label: "Каталог", icon: Library, testId: "nav-catalog" },
  { href: "/create", label: "Своя история", icon: Wand2, testId: "nav-create" },
  { href: "/my", label: "Мои книги", icon: BookHeart, testId: "nav-my" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-4 px-4">
        <Link href="/" aria-label="Fabulka — на главную">
          <Logo />
        </Link>
        <nav className="ml-auto flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon, testId }) => {
            const active = href === "/" ? pathname === "/" || pathname.startsWith("/catalog") : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                data-testid={testId}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold ${
                  active ? "bg-accent/15 text-accent" : "text-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
