"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BOOK_PRICE_KZT } from "@wishbook/shared";
import { KeyRound, Loader2, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { buyBook, setDemoCode } from "@/lib/api";
import { formatKzt } from "@/lib/format";

/** Shown when the free books are used up: the demo checkout, or a demo code for judges. */
export function Paywall({ onUnlocked }: { onUnlocked: () => void }) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const unlocked = () => {
    void queryClient.invalidateQueries({ queryKey: ["quota"] });
    onUnlocked();
  };
  const buy = useMutation({ mutationFn: buyBook, onSuccess: unlocked });

  return (
    <section data-testid="paywall" className="flex flex-col gap-4 rounded-2xl border-2 border-accent bg-card p-5 sm:col-span-2">
      <div>
        <h2 className="text-lg font-extrabold">Бесплатные книги закончились</h2>
        <p className="text-muted">Каждая следующая книга — {formatKzt(BOOK_PRICE_KZT)}. PDF сразу, печать — по желанию.</p>
      </div>
      <button
        type="button"
        data-testid="buy-book"
        disabled={buy.isPending}
        onClick={() => buy.mutate()}
        className="flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 font-bold text-accent-foreground disabled:opacity-60"
      >
        {buy.isPending ? <Loader2 className="size-5 animate-spin" /> : <ShoppingBag className="size-5" />}
        Купить книгу — {formatKzt(BOOK_PRICE_KZT)}
      </button>
      <p className="text-xs text-muted">Демо: оплата не списывается.</p>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!code.trim()) return;
          setDemoCode(code);
          unlocked();
        }}
      >
        <input
          data-testid="demo-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Демо-код"
          className="w-full rounded-xl border border-border bg-background px-4 py-2"
        />
        <button type="submit" data-testid="apply-demo-code" className="flex items-center gap-1 rounded-xl border border-border px-4 font-semibold">
          <KeyRound className="size-4" /> Применить
        </button>
      </form>
    </section>
  );
}
