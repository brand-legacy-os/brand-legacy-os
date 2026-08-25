"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { TASK_STATUS_META, TASK_PRIORITY_META } from "@/lib/format";

type Option = { value: string; label: string };

export function WorkflowFilterBar({
  areaOptions,
  responsibleOptions,
}: {
  areaOptions: Option[];
  responsibleOptions: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  const selectClass =
    "h-9 rounded-full border border-border bg-surface px-3.5 text-[12.5px] text-ink-soft outline-none";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {areaOptions.length > 1 && (
        <select
          value={searchParams.get("area") ?? ""}
          onChange={(e) => update("area", e.target.value)}
          className={selectClass}
        >
          <option value="">Todos os departamentos</option>
          {areaOptions.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      )}

      <select
        value={searchParams.get("responsavel") ?? ""}
        onChange={(e) => update("responsavel", e.target.value)}
        className={selectClass}
      >
        <option value="">Todos os colaboradores</option>
        {responsibleOptions.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => update("status", e.target.value)}
        className={selectClass}
      >
        <option value="">Todos os status</option>
        {Object.entries(TASK_STATUS_META).map(([key, meta]) => (
          <option key={key} value={key}>
            {meta.dot} {meta.label}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("prioridade") ?? ""}
        onChange={(e) => update("prioridade", e.target.value)}
        className={selectClass}
      >
        <option value="">Todas as prioridades</option>
        {Object.entries(TASK_PRIORITY_META).map(([key, meta]) => (
          <option key={key} value={key}>
            {meta.label}
          </option>
        ))}
      </select>
    </div>
  );
}
