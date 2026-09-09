"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format";
import { deleteCsActionAction } from "@/lib/actions/cs";
import { CreateCsActionForm } from "@/components/cs/create-cs-action-form";

export function CsActionRow({
  action,
  createdByName,
  canManage,
}: {
  action: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    link: string | null;
    materialsUrl: string | null;
    date: Date;
  };
  createdByName: string;
  canManage: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <CreateCsActionForm defaults={action} onDone={() => setEditing(false)} />;
  }

  return (
    <div className="rounded-(--radius-l) border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-ink">{action.title}</span>
        <span className="text-[11.5px] text-ink-faint">{formatDate(action.date)} · {createdByName}</span>
      </div>
      {action.description && <p className="mt-1 text-[12.5px] text-ink-soft">{action.description}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px]">
        {action.location && <span className="text-ink-faint">📍 {action.location}</span>}
        {action.link && <a href={action.link} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">Link →</a>}
        {action.materialsUrl && <a href={action.materialsUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">Materiais →</a>}
        {canManage && (
          <>
            <button onClick={() => setEditing(true)} className="text-[11.5px] font-medium text-brand hover:underline">
              Editar
            </button>
            <form
              action={deleteCsActionAction}
              onSubmit={(e) => {
                if (!confirm("Excluir esta ação? Essa ação não pode ser desfeita.")) e.preventDefault();
              }}
            >
              <input type="hidden" name="actionId" value={action.id} />
              <button className="text-[11.5px] font-medium text-critical hover:underline">Excluir</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
