"use client";

import { useActionState } from "react";
import { createRequestAction } from "@/lib/actions/requests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function NewRequestPage() {
  const [state, action, pending] = useActionState(
    createRequestAction,
    undefined,
  );

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">← Geri</Link>
          </Button>
          <h1 className="font-semibold text-zinc-900 dark:text-zinc-50">
            Yeni Satın Alma Talebi
          </h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-6 py-10">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <form action={action} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="title">Başlık</Label>
              <Input
                id="title"
                name="title"
                placeholder="Ör: Ergonomik Klavye"
                required
              />
              {state?.errors?.title && (
                <p className="text-sm text-destructive">
                  {state.errors.title[0]}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Tutar (USD)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                required
              />
              {state?.errors?.amount && (
                <p className="text-sm text-destructive">
                  {state.errors.amount[0]}
                </p>
              )}
              <p className="text-xs text-zinc-400">
                0–300 $: Müdür/Direktör · 301–10.000 $: GMY/GM · &gt;10.000 $:
                YK Üyesi
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">
                Açıklama{" "}
                <span className="text-zinc-400 font-normal">(opsiyonel)</span>
              </Label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Satın alma gerekçesi..."
                className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:focus:ring-zinc-600"
              />
            </div>

            {state?.message && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.message}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Gönderiliyor…" : "Talebi Gönder"}
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">İptal</Link>
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
