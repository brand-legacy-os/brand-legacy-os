"use client";

import { useTransition } from "react";
import { toggleChecklistItemAction } from "@/lib/actions/tasks";

export function ChecklistItem({
  id,
  label,
  done,
  canManage,
}: {
  id: string;
  label: string;
  done: boolean;
  canManage: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <label
      className={`flex items-center gap-2.5 rounded-(--radius-s) px-2 py-1.5 text-[13px] ${
        canManage ? "cursor-pointer hover:bg-surface-muted" : ""
      } ${pending ? "opacity-60" : ""}`}
    >
      <input
        type="checkbox"
        defaultChecked={done}
        disabled={!canManage || pending}
        onChange={() => {
          const fd = new FormData();
          fd.set("itemId", id);
          startTransition(() => {
            toggleChecklistItemAction(fd);
          });
        }}
        className="h-4 w-4 accent-brand-deep"
      />
      <span className={done ? "text-ink-faint line-through" : "text-ink"}>
        {label}
      </span>
    </label>
  );
}
