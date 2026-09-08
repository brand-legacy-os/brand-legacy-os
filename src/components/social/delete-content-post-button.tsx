"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteContentPostByIdAction } from "@/lib/actions/social";

export function DeleteContentPostButton({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    if (!confirm("Excluir este post do calendário? Essa ação não pode ser desfeita.")) return;
    startTransition(async () => {
      const result = await deleteContentPostByIdAction(postId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/social/calendario");
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-[12px] font-medium text-critical hover:underline disabled:opacity-50"
      >
        {pending ? "Excluindo…" : "Excluir post"}
      </button>
      {error && <span className="text-[11.5px] text-critical">{error}</span>}
    </span>
  );
}
