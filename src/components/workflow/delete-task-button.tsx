"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTaskAction } from "@/lib/actions/tasks";

export function DeleteTaskButton({
  taskId,
  redirectTo,
  className,
  label = "Excluir",
}: {
  taskId: string;
  redirectTo?: string;
  className?: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Excluir esta tarefa? Essa ação não pode ser desfeita.")) return;
    startTransition(async () => {
      const result = await deleteTaskAction(taskId);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={
          className ??
          "text-[12px] font-medium text-critical hover:underline disabled:opacity-50"
        }
      >
        {pending ? "Excluindo…" : label}
      </button>
      {error && <span className="text-[11.5px] text-critical">{error}</span>}
    </span>
  );
}
