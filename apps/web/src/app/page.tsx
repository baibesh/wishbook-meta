import { BookForm } from "@/components/book-form";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-bold uppercase tracking-widest text-accent">WishBook</p>
        <h1 className="text-4xl font-extrabold leading-tight">Книга, где ваш ребёнок — главный герой</h1>
        <p className="text-lg text-muted">
          Расскажите о ребёнке — мы напишем сказку и нарисуем иллюстрации, где он узнает себя на каждой странице.
        </p>
      </header>
      <BookForm />
      <footer className="text-center text-xs text-muted">Powered by Meta Muse models</footer>
    </main>
  );
}
