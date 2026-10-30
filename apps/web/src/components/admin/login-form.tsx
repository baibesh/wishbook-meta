"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminLogin } from "@/lib/admin-api";
import { button, input } from "./ui";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useMutation({ mutationFn: adminLogin, onSuccess: () => router.replace("/admin") });

  return (
    <form
      data-testid="admin-login"
      onSubmit={(event) => {
        event.preventDefault();
        login.mutate({ email, password });
      }}
      className="flex w-full max-w-sm flex-col gap-4 rounded-3xl border border-border bg-card p-8"
    >
      <div className="flex items-center gap-2 text-xl font-extrabold">
        <Lock className="size-5 text-accent" />
        Вход в админку
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Почта
        <input data-testid="admin-email" type="email" autoComplete="username" className={input} value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Пароль
        <input
          data-testid="admin-password"
          type="password"
          autoComplete="current-password"
          className={input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {login.isError && (
        <p role="alert" className="text-sm text-red-600">
          {login.error.message}
        </p>
      )}
      <button type="submit" data-testid="admin-submit" disabled={login.isPending} className={`${button} flex items-center justify-center gap-2 py-3`}>
        {login.isPending && <Loader2 className="size-4 animate-spin" />}
        Войти
      </button>
    </form>
  );
}
