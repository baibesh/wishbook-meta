import { Suspense } from "react";
import { BookView } from "@/components/book-view";
import { T } from "@/components/t";

export default function BookPage({ params }: PageProps<"/books/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <Suspense fallback={<p className="text-muted">
            <T k="common.loading" />
          </p>}>
        <BookView params={params} />
      </Suspense>
    </main>
  );
}
