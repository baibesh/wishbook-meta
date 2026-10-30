import Link from "next/link";
import { BookForm } from "@/components/book-form";
import { T } from "@/components/t";

export default function CreatePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <Link href="/" className="text-sm font-semibold text-accent">
        <T k="common.back.catalog" />
      </Link>
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-extrabold leading-tight">
          <T k="create.title" />
        </h1>
        <p className="text-lg text-muted">
          <T k="create.lead" />
        </p>
      </header>
      <BookForm />
    </main>
  );
}
