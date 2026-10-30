"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LIMIT_REACHED,
  METHODOLOGIES,
  answersProblem,
  fitsAge,
  type MethodologySlug,
  type Template,
} from "@fabulka/shared";
import { BookOpen, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { ApiError, createBook, getQuota, uploadToy } from "@/lib/api";
import { toJpegDataUrl } from "@/lib/toy-photo";
import { Paywall } from "./paywall";

const FormSchema = z.object({
  name: z.string().trim().min(1, "Введите имя").max(40),
  age: z.string(),
  gender: z.enum(["boy", "girl"]),
  interests: z.string().trim().min(1, "Назовите хотя бы одно увлечение"),
  pet: z.string().trim().max(60),
  city: z.string().trim().min(1, "Введите город").max(60),
  language: z.enum(["ru", "kk", "en"]),
  /** "" lets the API pick a method by age. */
  methodology: z.string(),
  theme: z.string().trim().max(200),
  toyName: z.string().trim().max(40),
  answers: z.record(z.string(), z.string()),
});
type FormValues = z.infer<typeof FormSchema>;

const ages = (min: number, max: number) => Array.from({ length: max - min + 1 }, (_, i) => String(i + min));

const field = "w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:border-accent";
const label = "flex flex-col gap-1.5 text-sm font-semibold";

/** A book of your own, or, with `template`, a catalog book with its questions. */
export function BookForm({ template }: { template?: Template }) {
  const router = useRouter();
  const ageOptions = template ? ages(template.ageMin, template.ageMax) : ages(2, 10);
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      age: ageOptions.includes("5") ? "5" : ageOptions[0],
      gender: "girl",
      interests: "",
      pet: "",
      city: "Алматы",
      language: "ru",
      methodology: "",
      theme: "",
      toyName: "",
      answers: {},
    },
  });
  const age = Number(useWatch({ control: form.control, name: "age" }));
  const methods = METHODOLOGIES.filter((m) => fitsAge(m.slug, age));
  const errors = form.formState.errors;
  const queryClient = useQueryClient();
  const quota = useQuery({ queryKey: ["quota"], queryFn: getQuota });

  const [toyPhoto, setToyPhoto] = useState<File | null>(null);
  const toyPreview = useMemo(() => (toyPhoto ? URL.createObjectURL(toyPhoto) : null), [toyPhoto]);
  useEffect(() => () => void (toyPreview && URL.revokeObjectURL(toyPreview)), [toyPreview]);

  const create = useMutation({
    mutationFn: async (values: FormValues) =>
      createBook({
        child: {
          name: values.name,
          age: Number(values.age),
          gender: values.gender,
          interests: values.interests.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 5),
          pet: values.pet || undefined,
          city: values.city,
          language: values.language,
        },
        ...(toyPhoto && {
          toy: { upload: await uploadToy(await toJpegDataUrl(toyPhoto)), name: values.toyName || undefined },
        }),
        ...(template
          ? { template: template.slug, answers: values.answers }
          : {
              methodology: methods.some((m) => m.slug === values.methodology)
                ? (values.methodology as MethodologySlug)
                : undefined,
              theme: values.theme || undefined,
            }),
      }),
    onSuccess: (book) => {
      void queryClient.invalidateQueries({ queryKey: ["quota"] });
      router.push(`/books/${book.id}`);
    },
  });
  const submit = form.handleSubmit((values) => {
    const problem = template && answersProblem(template.questions, values.answers);
    if (problem) return form.setError("root.answers", { message: problem });
    create.mutate(values);
  });
  const limitReached = create.error instanceof ApiError && create.error.code === LIMIT_REACHED;

  return (
    <div className="flex flex-col gap-4">
    <form
      data-testid="book-form"
      onSubmit={submit}
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
          {ageOptions.map((age) => (
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
          <option value="en">English</option>
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

      <fieldset className="grid gap-4 rounded-2xl border border-dashed border-border p-4 sm:col-span-2 sm:grid-cols-[8rem_1fr]">
        <legend className="px-1 text-sm font-semibold">Любимая игрушка (необязательно)</legend>
        <label className="relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border bg-background text-center text-xs text-muted hover:border-accent">
          {toyPreview ? (
            // eslint-disable-next-line @next/next/no-img-element -- a local preview of the chosen file
            <img src={toyPreview} alt="Фото игрушки" className="h-full w-full object-cover" />
          ) : (
            <span className="p-2">Выбрать фото</span>
          )}
          <input
            data-testid="toy-photo"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => setToyPhoto(e.target.files?.[0] ?? null)}
          />
        </label>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            Сфотографируйте игрушку, с которой ребёнок не расстаётся: она станет его другом в сказке и будет нарисована
            такой же на каждой странице.
          </p>
          <input data-testid="toy-name" className={field} placeholder="Как её зовут? Например, Бусинка" {...form.register("toyName")} />
          {toyPhoto && (
            <button type="button" onClick={() => setToyPhoto(null)} className="flex items-center gap-1 self-start text-sm text-muted hover:text-foreground">
              <X className="size-4" />
              Убрать фото
            </button>
          )}
        </div>
      </fieldset>

      {template ? (
        <fieldset data-testid="template-questions" className="grid gap-5 sm:col-span-2 sm:grid-cols-2">
          <legend className="mb-3 text-lg font-bold">Пара вопросов для этой книги</legend>
          {template.questions.map((q) => (
            <label key={q.key} className={label}>
              {q.label}
              {!q.required && <span className="font-normal text-muted">(необязательно)</span>}
              {q.kind === "choice" ? (
                <select data-testid={`answer-${q.key}`} className={field} {...form.register(`answers.${q.key}`)}>
                  <option value="">—</option>
                  {q.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  data-testid={`answer-${q.key}`}
                  className={field}
                  placeholder={q.placeholder}
                  {...form.register(`answers.${q.key}`)}
                />
              )}
            </label>
          ))}
          {errors.root?.answers && (
            <p role="alert" className="text-red-600 sm:col-span-2">
              {errors.root.answers.message}
            </p>
          )}
        </fieldset>
      ) : (
        <>
          <label className={`${label} sm:col-span-2`}>
            О чём книга (необязательно)
            <input
              data-testid="book-theme"
              className={field}
              placeholder="первый день в детском саду, боится темноты, скоро родится братик"
              {...form.register("theme")}
            />
          </label>
          <label className={`${label} sm:col-span-2`}>
            Методика
            <select data-testid="book-methodology" className={field} {...form.register("methodology")}>
              <option value="">Подобрать по возрасту</option>
              {methods.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name} — {m.summary}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

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
        {quota.data && (
          <p data-testid="quota" className="text-center text-sm text-muted">
            {quota.data.demo
              ? "Демо-режим: без ограничений"
              : `Бесплатных книг осталось: ${quota.data.remaining} из ${quota.data.limit}`}
          </p>
        )}
        {create.isError && !limitReached && (
          <p role="alert" className="text-red-600">
            Не получилось начать: {create.error.message}
          </p>
        )}
      </div>
    </form>
    {limitReached && <Paywall onUnlocked={() => void submit()} />}
    </div>
  );
}
