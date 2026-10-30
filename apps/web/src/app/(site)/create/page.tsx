import Link from "next/link";
import { BookForm } from "@/components/book-form";

export default function CreatePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <Link href="/" className="text-sm font-semibold text-accent">
        ← Каталог
      </Link>
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-extrabold leading-tight">Своя история</h1>
        <p className="text-lg text-muted">
          Расскажите о ребёнке и о чём должна быть книга. Сказку напишут с нуля по выбранной методике.
        </p>
      </header>
      <BookForm />
    </main>
  );
}
