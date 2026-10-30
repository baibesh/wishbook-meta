import Link from "next/link";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <Logo className="text-foreground" />
          <span>Книги, где ваш ребёнок — главный герой. Powered by Meta Muse models.</span>
        </div>
        <nav className="flex flex-wrap gap-4">
          <Link href="/privacy" className="hover:text-foreground">
            Конфиденциальность
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Условия
          </Link>
          <a href="mailto:hello@fabulka.com" className="hover:text-foreground">
            hello@fabulka.com
          </a>
        </nav>
      </div>
    </footer>
  );
}
