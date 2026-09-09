"use client";

import { useActionState, useState } from "react";
import { updateContentWeekPlanCellAction, type ActionState } from "@/lib/actions/social";
import { parseContentPlanCell } from "@/lib/content-week-plan";

const initialState: ActionState = {};

export function ContentWeekCell({
  profileId,
  weekday,
  content,
  canEdit,
}: {
  profileId: string;
  weekday: number;
  content: string;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateContentWeekPlanCellAction, initialState);

  if (editing) {
    return (
      <form
        action={formAction}
        className="flex min-w-[220px] flex-col gap-1.5 p-2"
        onSubmit={() => setTimeout(() => setEditing(false), 0)}
      >
        <input type="hidden" name="profileId" value={profileId} />
        <input type="hidden" name="weekday" value={weekday} />
        <textarea
          name="content"
          defaultValue={content}
          rows={7}
          placeholder={"REELS: tema...\n  - STORIES: levantada de mão\n\n*[nota entre colchetes]*"}
          className="w-full rounded-(--radius-s) border border-border bg-surface p-2 text-[12px] leading-relaxed outline-none focus:border-brand-deep-2"
        />
        <div className="flex items-center gap-2">
          <button type="submit" disabled={pending} className="h-7 rounded-(--radius-s) bg-brand-deep px-2.5 text-[11px] font-medium text-gold-soft disabled:opacity-60">
            {pending ? "…" : "Salvar"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="text-[11px] text-ink-faint hover:underline">
            cancelar
          </button>
          {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
        </div>
      </form>
    );
  }

  const lines = parseContentPlanCell(content);

  return (
    <div
      className={`min-w-[220px] p-2 align-top text-[12px] leading-relaxed text-ink-soft ${canEdit ? "cursor-pointer hover:bg-surface-muted" : ""}`}
      onClick={() => canEdit && setEditing(true)}
    >
      {lines.length === 0 ? (
        <span className="text-ink-faint">{canEdit ? "Clique para preencher…" : "—"}</span>
      ) : (
        <div className="flex flex-col gap-1">
          {lines.map((line, i) => (
            <div key={i} className={line.indent ? "ml-3 text-ink-faint" : "text-ink"}>
              <span className="mr-1">{line.indent ? "◦" : "•"}</span>
              {line.segments.map((seg, j) => (
                <span key={j} className={seg.bold ? "font-semibold" : undefined}>
                  {seg.italic ? <em>{seg.text}</em> : seg.text}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
