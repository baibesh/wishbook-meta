import { REGION_UNAVAILABLE } from "@fabulka/shared";
import { Globe } from "lucide-react";
import { ApiError } from "@/lib/api";

/** An API error; visitors from a restricted country get an explanation instead of a raw message. */
export function ErrorNotice({ error }: { error: Error }) {
  if (error instanceof ApiError && error.code === REGION_UNAVAILABLE) {
    return (
      <section data-testid="region-unavailable" role="alert" className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-8 text-center">
        <Globe className="mx-auto size-10 text-accent" />
        <h2 className="text-2xl font-extrabold">Сервис недоступен в вашей стране</h2>
        <p className="text-muted">
          Книги создаются моделями Meta, а их правила не разрешают предлагать сервис в некоторых странах.
        </p>
        <p className="text-sm text-muted">This service is not available in your country.</p>
      </section>
    );
  }
  return (
    <p role="alert" className="text-red-600">
      {error.message}
    </p>
  );
}
