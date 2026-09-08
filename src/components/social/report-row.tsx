"use client";

import { useState } from "react";
import { deleteProfileReportAction } from "@/lib/actions/social";
import { ProfileReportForm } from "./profile-report-form";
import { ReportAttachments } from "./report-attachments";
import { formatDate } from "@/lib/format";

type Report = {
  id: string;
  title: string;
  reportMonth: string;
  dueDate: Date | string | null;
  periodAnalyzed: string | null;
  summary: string | null;
  notes: string | null;
  createdBy: { name: string };
  createdAt: Date | string;
  attachments: { id: string; label: string; url: string }[];
};

export function ReportRow({
  profileId,
  report,
  canEdit,
}: {
  profileId: string;
  report: Report;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="border-t border-border py-3 first:border-t-0">
        <ProfileReportForm profileId={profileId} defaults={report} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border py-3 first:border-t-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[13px] text-ink">{report.title}</span>
          <span className="text-[11.5px] text-ink-faint">
            {report.reportMonth}
            {report.dueDate ? ` · entrega ${formatDate(new Date(report.dueDate))}` : ""}
            {report.periodAnalyzed ? ` · período: ${report.periodAnalyzed}` : ""} · {report.createdBy.name}
          </span>
        </div>
        {canEdit && (
          <div className="flex shrink-0 items-center gap-2.5">
            <button onClick={() => setEditing(true)} className="text-[11.5px] font-medium text-brand hover:underline">
              editar
            </button>
            <form
              action={deleteProfileReportAction}
              onSubmit={(e) => {
                if (!confirm(`Excluir "${report.title}"?`)) e.preventDefault();
              }}
            >
              <input type="hidden" name="reportId" value={report.id} />
              <button className="text-[11.5px] text-ink-faint hover:text-critical">excluir</button>
            </form>
          </div>
        )}
      </div>
      {report.summary && <p className="text-[12.5px] leading-relaxed text-ink-soft">{report.summary}</p>}
      {report.notes && <p className="text-[12px] italic text-ink-faint">{report.notes}</p>}
      <ReportAttachments reportId={report.id} attachments={report.attachments} canEdit={canEdit} />
    </div>
  );
}
