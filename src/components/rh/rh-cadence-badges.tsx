import { StatusPill, type Tone } from "@/components/ui/status-pill";
import type { RhCadenceStatus } from "@/lib/rh";
import { formatDate } from "@/lib/format";

function toneFor(status: RhCadenceStatus): Tone {
  if (status.overdue) return status.last ? "critical" : "warning";
  return status.last ? "positive" : "neutral";
}

export function RhCadenceBadges({ statuses }: { statuses: RhCadenceStatus[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {statuses.map((s) => (
        <StatusPill
          key={s.type}
          tone={toneFor(s)}
          label={`${s.label}: ${s.last ? formatDate(s.last.date) : "nunca"}`}
        />
      ))}
    </div>
  );
}
