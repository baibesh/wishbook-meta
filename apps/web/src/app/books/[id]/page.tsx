import Link from "next/link";
import { Suspense } from "react";
import { BookView } from "@/components/book-view";

export default function BookPage({ params }: PageProps<"/books/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <Link href="/" className="text-sm font-semibold text-accent">
        ← Новая книга
      </Link>
      <Suspense fallback={<p className="text-muted">Загружаем…</p>}>
        <BookView params={params} />
      </Suspense>
    </main>
  );
}
