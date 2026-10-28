"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { BookOpen, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createBook } from "@/lib/api";

const FormSchema = z.object({
  name: z.string().trim().min(1, "Введите имя").max(40),
  age: z.string(),
  gender: z.enum(["boy", "girl"]),
  interests: z.string().trim().min(1, "Назовите хотя бы одно увлечение"),
  pet: z.string().trim().max(60),
  city: z.string().trim().min(1, "Введите город").max(60),
  language: z.enum(["ru", "kk"]),
});
type FormValues = z.infer<typeof FormSchema>;

const AGES = Array.from({ length: 9 }, (_, i) => String(i + 2));

const field = "w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:border-accent";
const label = "flex flex-col gap-1.5 text-sm font-semibold";

export function BookForm() {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: "", age: "5", gender: "girl", interests: "", pet: "", city: "Алматы", language: "ru" },
  });
  const errors = form.formState.errors;

  const create = useMutation({
    mutationFn: (values: FormValues) =>
      createBook({
        name: values.name,
        age: Number(values.age),
        gender: values.gender,
        interests: values.interests.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 5),
        pet: values.pet || undefined,
        city: values.city,
        language: values.language,
      }),
    onSuccess: (book) => router.push(`/books/${book.id}`),
  });

  return (
    <form
      data-testid="book-form"
      onSubmit={form.handleSubmit((values) => create.mutate(values))}
      className="grid gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm sm:grid-cols-2"
    >
      <label className={label}>
        Имя ребёнка
        <input data-testid="child-name" className={field} placeholder="Айгерим" {...form.register("name")} />
        {errors.name && <span className="text-red-600">{errors.name.message}</span>}
      </label>

      <label className={label}>
        Возраст
        <select data-testid="child-age" className={field} {...form.register("age")}>
          {AGES.map((age) => (
            <option key={age} value={age}>
              {age}
            </option>
          ))}
        </select>
      </label>

      <fieldset className={label}>
        <legend className="mb-1.5">Кто герой</legend>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 font-normal">
            <input type="radio" value="girl" {...form.register("gender")} /> Девочка
          </label>
          <label className="flex items-center gap-2 font-normal">
            <input type="radio" value="boy" {...form.register("gender")} /> Мальчик
          </label>
        </div>
      </fieldset>

      <label className={label}>
        Язык книги
        <select data-testid="book-language" className={field} {...form.register("language")}>
          <option value="ru">Русский</option>
          <option value="kk">Қазақша</option>
        </select>
      </label>

      <label className={`${label} sm:col-span-2`}>
        Увлечения (через запятую)
        <input data-testid="child-interests" className={field} placeholder="космос, лошади, рисование" {...form.register("interests")} />
        {errors.interests && <span className="text-red-600">{errors.interests.message}</span>}
      </label>

      <label className={label}>
        Питомец (необязательно)
        <input data-testid="child-pet" className={field} placeholder="кот Барсик" {...form.register("pet")} />
      </label>

      <label className={label}>
        Город
        <input data-testid="child-city" className={field} {...form.register("city")} />
        {errors.city && <span className="text-red-600">{errors.city.message}</span>}
      </label>

      <div className="flex flex-col gap-2 sm:col-span-2">
        <button
          type="submit"
          data-testid="create-book"
          disabled={create.isPending}
          className="flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 text-lg font-bold text-accent-foreground disabled:opacity-60"
        >
          {create.isPending ? <Loader2 className="size-5 animate-spin" /> : <BookOpen className="size-5" />}
          Создать книгу
        </button>
        {create.isError && (
          <p role="alert" className="text-red-600">
            Не получилось начать: {create.error.message}
          </p>
        )}
      </div>
    </form>
  );
}
