"use client";

import { useActionState, useRef, useState } from "react";
import { uploadNpsExcelAction, type NpsExcelState } from "@/lib/actions/events";

const initialState: NpsExcelState = {};

export function NpsExcelForm({ eventId }: { eventId: string }) {
  const [state, formAction, pending] = useActionState(uploadNpsExcelAction, initialState);
  const ref = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="eventId" value={eventId} />
      <label className="flex w-fit items-center gap-2 text-[11.5px] font-medium text-brand hover:underline">
        <input
          name="file"
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            setFileName(e.target.files?.[0]?.name ?? null);
            ref.current?.requestSubmit();
          }}
        />
        <span className="cursor-pointer">
          {pending ? "Processando…" : "Enviar planilha de respostas"}
        </span>
      </label>
      {fileName && !pending && <span className="text-[10.5px] text-ink-faint">{fileName}</span>}
      {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
      {state.success && <span className="text-[11px] text-positive">{state.count} respostas processadas.</span>}
    </form>
  );
}
