"use client";

import { useState, useTransition } from "react";
import {
  approveRequestAction,
  rejectRequestAction,
} from "@/lib/actions/requests";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function ApprovalActions({ requestId }: { requestId: string }) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleAction(type: "approve" | "reject") {
    setError(null);
    startTransition(async () => {
      const result =
        type === "approve"
          ? await approveRequestAction(requestId, comment || undefined)
          : await rejectRequestAction(requestId, comment || undefined);

      if (result && "error" in result) {
        setError(result.error);
      } else {
        router.push("/dashboard");
      }
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Karar Ver</h3>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Yorum ekle (opsiyonel)…"
        className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:focus:ring-zinc-600"
      />
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button disabled={isPending} onClick={() => handleAction("approve")}>
          Onayla
        </Button>
        <Button
          variant="destructive"
          disabled={isPending}
          onClick={() => handleAction("reject")}
        >
          Reddet
        </Button>
      </div>
    </div>
  );
}
