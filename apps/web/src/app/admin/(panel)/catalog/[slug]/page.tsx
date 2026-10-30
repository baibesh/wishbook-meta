import { Suspense } from "react";
import { TemplateEditor } from "@/components/admin/template-editor";

export default function AdminTemplatePage({ params }: PageProps<"/admin/catalog/[slug]">) {
  return (
    <Suspense fallback={<p className="text-muted">Загружаем…</p>}>
      <TemplateEditor params={params} />
    </Suspense>
  );
}
