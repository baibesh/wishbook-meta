"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { COVER_PRICE_KZT, CreateOrderSchema, orderPrice, type CreateOrderInput } from "@fabulka/shared";
import { Loader2, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { createOrder, getBook } from "@/lib/api";
import { formatKzt } from "@/lib/format";

const CITIES = ["Алматы", "Астана", "Шымкент", "Караганда", "Актобе", "Тараз", "Павлодар", "Усть-Каменогорск", "Атырау", "Костанай"];

type FormValues = z.input<typeof CreateOrderSchema>;

const field = "w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:border-accent";
const label = "flex flex-col gap-1.5 text-sm font-semibold";

export function OrderForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const book = useQuery({ queryKey: ["book", id], queryFn: () => getBook(id) });
  const form = useForm<FormValues, unknown, CreateOrderInput>({
    resolver: zodResolver(CreateOrderSchema),
    defaultValues: { bookId: id, recipientName: "", phone: "+7 ", city: "Алматы", address: "", cover: "soft", quantity: 1 },
  });
  const errors = form.formState.errors;
  const [cover, quantity, city] = useWatch({ control: form.control, name: ["cover", "quantity", "city"] });
  const price = orderPrice(cover, Number(quantity) || 1, city);

  const order = useMutation({
    mutationFn: createOrder,
    onSuccess: (created) => router.push(`/orders/${created.id}`),
  });

  return (
    <form data-testid="order-form" onSubmit={form.handleSubmit((values) => order.mutate(values))} className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold">Печатная книга</h1>
        {book.data?.title && <p className="text-muted">«{book.data.title}»</p>}
      </header>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        {(["soft", "hard"] as const).map((value) => (
          <label key={value} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card p-4 has-[:checked]:border-accent">
            <input type="radio" value={value} data-testid={`cover-${value}`} {...form.register("cover")} />
            <span className="flex flex-col">
              <span className="font-bold">{value === "soft" ? "Мягкая обложка" : "Твёрдая обложка"}</span>
              <span className="text-muted">{formatKzt(COVER_PRICE_KZT[value])}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="grid gap-5 rounded-3xl border border-border bg-card p-6 sm:grid-cols-2">
        <label className={label}>
          Получатель
          <input data-testid="recipient-name" className={field} placeholder="Имя и фамилия" {...form.register("recipientName")} />
          {errors.recipientName && <span className="text-red-600">Укажите имя получателя</span>}
        </label>
        <label className={label}>
          Телефон
          <input data-testid="phone" className={field} inputMode="tel" {...form.register("phone")} />
          {errors.phone && <span className="text-red-600">{errors.phone.message}</span>}
        </label>
        <label className={label}>
          Город
          <select data-testid="city" className={field} {...form.register("city")}>
            {CITIES.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          Количество
          <select data-testid="quantity" className={field} {...form.register("quantity")}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className={`${label} sm:col-span-2`}>
          Адрес
          <input data-testid="address" className={field} placeholder="Улица, дом, квартира" {...form.register("address")} />
          {errors.address && <span className="text-red-600">Укажите адрес доставки</span>}
        </label>
      </div>

      <section data-testid="order-summary" className="flex flex-col gap-1 rounded-2xl bg-card p-5">
        <div className="flex justify-between">
          <span>Книги</span>
          <span>{formatKzt(price.books)}</span>
        </div>
        <div className="flex justify-between">
          <span>Доставка</span>
          <span>{price.delivery ? formatKzt(price.delivery) : "бесплатно"}</span>
        </div>
        <div className="flex justify-between text-lg font-extrabold">
          <span>Итого</span>
          <span data-testid="order-total">{formatKzt(price.total)}</span>
        </div>
      </section>

      <button
        type="submit"
        data-testid="place-order"
        disabled={order.isPending}
        className="flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 text-lg font-bold text-accent-foreground disabled:opacity-60"
      >
        {order.isPending ? <Loader2 className="size-5 animate-spin" /> : <Printer className="size-5" />}
        Оплатить и заказать
      </button>
      <p className="text-center text-xs text-muted">Демо: оплата не списывается, печать и доставка показаны для примера.</p>
      {order.isError && (
        <p role="alert" className="text-red-600">
          Не получилось оформить заказ: {order.error.message}
        </p>
      )}
    </form>
  );
}
