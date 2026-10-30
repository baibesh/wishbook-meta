import { Suspense } from "react";
import { BookDetail } from "@/components/admin/book-detail";

export default function AdminBookPage({ params }: PageProps<"/admin/books/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted">Загружаем…</p>}>
      <BookDetail params={params} />
    </Suspense>
  );
}
