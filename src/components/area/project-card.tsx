import Link from "next/link";
import { PROJECT_STATUS_META, formatDate } from "@/lib/format";
import { StatusPill, projectStatusTone } from "@/components/ui/status-pill";
import { updateProjectAction } from "@/lib/actions/projects";
import type { ProjectStatus } from "@prisma/client";

export function ProjectCard({
  id,
  name,
  status,
  progressPct,
  deadline,
  ownerName,
  areaName,
  areaHref,
  canEdit,
}: {
  id?: string;
  name: string;
  status: ProjectStatus;
  progressPct: number;
  deadline: Date;
  ownerName: string;
  areaName?: string;
  areaHref?: string;
  canEdit?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13.5px] font-medium text-ink">{name}</span>
          <span className="text-[11.5px] text-ink-faint">
            {ownerName} · prazo {formatDate(deadline)}
            {areaName && areaHref && (
              <>
                {" · "}
                <Link href={areaHref} className="hover:underline">
                  {areaName}
                </Link>
              </>
            )}
          </span>
        </div>
        <StatusPill
          label={PROJECT_STATUS_META[status].label}
          tone={projectStatusTone(status)}
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
          <span
            className="block h-full rounded-full bg-brand"
            style={{ width: `${Math.min(100, Math.max(2, progressPct))}%` }}
          />
        </div>
        <span className="tnum text-[12px] font-medium text-ink-soft">
          {progressPct}%
        </span>
      </div>

      {canEdit && id && (
        <form
          action={updateProjectAction}
          className="flex items-center gap-2 border-t border-border pt-2.5"
        >
          <input type="hidden" name="projectId" value={id} />
          <select
            name="status"
            defaultValue={status}
            className="h-7 flex-1 rounded-(--radius-s) border border-border bg-canvas px-2 text-[11.5px] outline-none"
          >
            {Object.entries(PROJECT_STATUS_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
          <input
            name="progressPct"
            type="number"
            min={0}
            max={100}
            defaultValue={progressPct}
            className="h-7 w-16 rounded-(--radius-s) border border-border bg-canvas px-2 text-[11.5px] outline-none"
          />
          <button
            type="submit"
            className="h-7 rounded-(--radius-s) bg-surface-muted px-2.5 text-[11.5px] font-medium text-ink-soft hover:bg-border-strong/30"
          >
            Atualizar
          </button>
        </form>
      )}
    </div>
  );
}
