import Link from "next/link";
import { Suspense } from "react";
import { TemplateView } from "@/components/template-view";
import { T } from "@/components/t";

export default function TemplatePage({ params }: PageProps<"/catalog/[slug]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <Link href="/catalog" className="text-sm font-semibold text-accent">
        <T k="common.back.catalog" />
      </Link>
      <Suspense fallback={<p className="text-muted">
            <T k="common.loading" />
          </p>}>
        <TemplateView params={params} />
      </Suspense>
    </main>
  );
}
