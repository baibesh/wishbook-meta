import Link from "next/link";
import { Suspense } from "react";
import { TemplateView } from "@/components/template-view";

export default function TemplatePage({ params }: PageProps<"/catalog/[slug]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <Link href="/" className="text-sm font-semibold text-accent">
        ← Каталог
      </Link>
      <Suspense fallback={<p className="text-muted">Загружаем…</p>}>
        <TemplateView params={params} />
      </Suspense>
    </main>
  );
}
