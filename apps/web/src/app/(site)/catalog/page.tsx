import type { Metadata } from "next";
import { Catalog } from "@/components/catalog";
import { T } from "@/components/t";

export const metadata: Metadata = {
  title: "Каталог книг",
  description:
    "Персональные детские книги по методикам детского развития: первый день в садике, большие чувства, Наурыз и другие истории, где ваш ребёнок — главный герой.",
};

export default function CatalogPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12">
      <header className="flex max-w-3xl flex-col gap-3">
        <h1 className="text-4xl font-extrabold leading-tight">
          <T k="catalog.title" />
        </h1>
        <p className="text-lg text-muted">
          <T k="catalog.lead" />
        </p>
      </header>
      <Catalog />
    </main>
  );
}
