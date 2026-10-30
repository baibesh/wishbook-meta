import { Catalog } from "@/components/catalog";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12">
      <header className="flex max-w-3xl flex-col gap-3">
        <p className="text-sm font-bold uppercase tracking-widest text-accent">Fabulka</p>
        <h1 className="text-4xl font-extrabold leading-tight">Книга, где ваш ребёнок — главный герой</h1>
        <p className="text-lg text-muted">
          Выберите историю, ответьте на пару вопросов — мы напишем сказку по детской методике и нарисуем
          иллюстрации, где ребёнок узнает себя на каждой странице.
        </p>
      </header>
      <Catalog />
      <footer className="text-center text-xs text-muted">Powered by Meta Muse models</footer>
    </main>
  );
}
