"use client";

import { useActionState, useRef, useState } from "react";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const QUICK_USERS = [
  { name: "Ahmet Yılmaz", email: "ahmet.yilmaz@sirket.com", role: "YK Üyesi" },
  { name: "Mehmet Kaya", email: "mehmet.kaya@sirket.com", role: "Genel Müdür" },
  {
    name: "Ayşe Demir",
    email: "ayse.demir@sirket.com",
    role: "GMY · Teknoloji",
  },
  {
    name: "Fatma Arslan",
    email: "fatma.arslan@sirket.com",
    role: "GMY · Operasyon",
  },
  {
    name: "Ali Şahin",
    email: "ali.sahin@sirket.com",
    role: "Direktör · Yazılım",
  },
  {
    name: "Emre Koç",
    email: "emre.koc@sirket.com",
    role: "Direktör · Altyapı",
  },
  {
    name: "Osman Güneş",
    email: "osman.gunes@sirket.com",
    role: "Direktör · Lojistik",
  },
  {
    name: "Zeynep Arslan",
    email: "zeynep.arslan@sirket.com",
    role: "Müdür · Frontend",
  },
  {
    name: "Can Öztürk",
    email: "can.ozturk@sirket.com",
    role: "Müdür · Backend",
  },
  {
    name: "Derya Çelik",
    email: "derya.celik@sirket.com",
    role: "Müdür · DevOps",
  },
  {
    name: "Kemal Doğan",
    email: "kemal.dogan@sirket.com",
    role: "Müdür · Tedarik",
  },
  {
    name: "Mert Aydın",
    email: "mert.aydin@sirket.com",
    role: "Çalışan · Frontend",
  },
  {
    name: "Selin Kılıç",
    email: "selin.kilic@sirket.com",
    role: "Çalışan · Frontend",
  },
  {
    name: "Baran Yıldız",
    email: "baran.yildiz@sirket.com",
    role: "Çalışan · Backend",
  },
  {
    name: "Hande Yılmaz",
    email: "hande.yilmaz@sirket.com",
    role: "Çalışan · DevOps",
  },
];

const PASSWORD = "Password123!";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function quickLogin(userEmail: string) {
    setEmail(userEmail);
    setPassword(PASSWORD);
    // Bir sonraki render'da form gönderilsin
    setTimeout(() => formRef.current?.requestSubmit(), 0);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-xl space-y-4">
        {/* Login kartı */}
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Satın Alma Talep Sistemi
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Devam etmek için giriş yapın.
            </p>
          </div>

          <form ref={formRef} action={action} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ad.soyad@sirket.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {state && "error" in state && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={pending}
              size="lg"
            >
              {pending ? "Giriş yapılıyor…" : "Giriş Yap"}
            </Button>
          </form>
        </div>

        {/* Hızlı giriş */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Hızlı Giriş — Test Kullanıcıları
          </p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {QUICK_USERS.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => quickLogin(u.email)}
                disabled={pending}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {u.name.charAt(0)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {u.name}
                  </span>
                  <span className="block truncate text-xs text-zinc-400">
                    {u.role}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
