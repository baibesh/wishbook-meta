"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LANGUAGES,
  LIMIT_REACHED,
  METHODOLOGIES,
  methodologyText,
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
import { useI18n } from "@/i18n/i18n";
import { LOCALE_NAMES } from "@/i18n/messages";
import { Paywall } from "./paywall";

const FormSchema = z.object({
  name: z.string().trim().min(1).max(40),
  age: z.string(),
  gender: z.enum(["boy", "girl"]),
  interests: z.string().trim().min(1),
  pet: z.string().trim().max(60),
  city: z.string().trim().min(1).max(60),
  language: z.enum(LANGUAGES),
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
  const { t, locale } = useI18n();
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
      language: locale,
      methodology: "",
      theme: "",
      toyName: "",
      answers: {},
    },
  });
  const age = Number(useWatch({ control: form.control, name: "age" }));
  // The interface language is known only after hydration; the book follows it until changed by hand.
  useEffect(() => {
    if (!form.getFieldState("language").isDirty) form.setValue("language", locale);
  }, [form, locale]);
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
        {t("form.name")}
        <input data-testid="child-name" className={field} placeholder={t("form.name.placeholder")} {...form.register("name")} />
        {errors.name && <span className="text-red-600">{t("form.name.error")}</span>}
      </label>

      <label className={label}>
        {t("form.age")}
        <select data-testid="child-age" className={field} {...form.register("age")}>
          {ageOptions.map((age) => (
            <option key={age} value={age}>
              {age}
            </option>
          ))}
        </select>
      </label>

      <fieldset className={label}>
        <legend className="mb-1.5">{t("form.hero")}</legend>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 font-normal">
            <input type="radio" value="girl" {...form.register("gender")} /> {t("form.girl")}
          </label>
          <label className="flex items-center gap-2 font-normal">
            <input type="radio" value="boy" {...form.register("gender")} /> {t("form.boy")}
          </label>
        </div>
      </fieldset>

      <label className={label}>
        {t("form.bookLanguage")}
        <select data-testid="book-language" className={field} {...form.register("language")}>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {LOCALE_NAMES[l]}
            </option>
          ))}
        </select>
      </label>

      <label className={`${label} sm:col-span-2`}>
        {t("form.interests")}
        <input data-testid="child-interests" className={field} placeholder={t("form.interests.placeholder")} {...form.register("interests")} />
        {errors.interests && <span className="text-red-600">{t("form.interests.error")}</span>}
      </label>

      <label className={label}>
        {t("form.pet")}
        <input data-testid="child-pet" className={field} placeholder={t("form.pet.placeholder")} {...form.register("pet")} />
      </label>

      <label className={label}>
        {t("form.city")}
        <input data-testid="child-city" className={field} {...form.register("city")} />
        {errors.city && <span className="text-red-600">{t("form.city.error")}</span>}
      </label>

      <fieldset className="grid gap-4 rounded-2xl border border-dashed border-border p-4 sm:col-span-2 sm:grid-cols-[8rem_1fr]">
        <legend className="px-1 text-sm font-semibold">{t("form.toy.legend")}</legend>
        <label className="relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border bg-background text-center text-xs text-muted hover:border-accent">
          {toyPreview ? (
            // eslint-disable-next-line @next/next/no-img-element -- a local preview of the chosen file
            <img src={toyPreview} alt={t("form.toy.alt")} className="h-full w-full object-cover" />
          ) : (
            <span className="p-2">{t("form.toy.pick")}</span>
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
            {t("form.toy.text")}
          </p>
          <input data-testid="toy-name" className={field} placeholder={t("form.toy.name")} {...form.register("toyName")} />
          {toyPhoto && (
            <button type="button" onClick={() => setToyPhoto(null)} className="flex items-center gap-1 self-start text-sm text-muted hover:text-foreground">
              <X className="size-4" />
              {t("form.toy.remove")}
            </button>
          )}
        </div>
      </fieldset>

      {template ? (
        <fieldset data-testid="template-questions" className="grid gap-5 sm:col-span-2 sm:grid-cols-2">
          <legend className="mb-3 text-lg font-bold">{t("form.questions")}</legend>
          {template.questions.map((q) => (
            <label key={q.key} className={label}>
              {q.label}
              {!q.required && <span className="font-normal text-muted">{t("common.optional")}</span>}
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
            {t("form.theme")}
            <input
              data-testid="book-theme"
              className={field}
              placeholder={t("form.theme.placeholder")}
              {...form.register("theme")}
            />
          </label>
          <label className={`${label} sm:col-span-2`}>
            {t("form.method")}
            <select data-testid="book-methodology" className={field} {...form.register("methodology")}>
              <option value="">{t("form.method.auto")}</option>
              {methods.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {methodologyText(m.slug, locale).name} — {methodologyText(m.slug, locale).summary}
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
          {t("form.submit")}
        </button>
        {quota.data && (
          <p data-testid="quota" className="text-center text-sm text-muted">
            {quota.data.demo
              ? t("form.quota.demo")
              : t("form.quota.left", { remaining: quota.data.remaining, limit: quota.data.limit })}
          </p>
        )}
        {create.isError && !limitReached && (
          <p role="alert" className="text-red-600">
            {t("form.error", { message: create.error.message })}
          </p>
        )}
      </div>
    </form>
    {limitReached && <Paywall onUnlocked={() => void submit()} />}
    </div>
  );
}
