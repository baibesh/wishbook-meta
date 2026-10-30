import { MyBooks } from "@/components/my-books";

export default function MyBooksPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-extrabold">Мои книги</h1>
      <MyBooks />
    </main>
  );
}
