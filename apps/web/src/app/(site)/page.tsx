import { Catalog } from "@/components/catalog";
import { T } from "@/components/t";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12">
      <header className="flex max-w-3xl flex-col gap-3">
        <h1 className="text-4xl font-extrabold leading-tight">
          <T k="home.title" />
        </h1>
        <p className="text-lg text-muted">
          <T k="home.lead" />
        </p>
      </header>
      <Catalog />
    </main>
  );
}
