"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { deleteSalaryRecordAction } from "@/lib/actions/salary";
import { SalaryRecordForm } from "./salary-record-form";

export function SalaryRecordRow({
  record,
  users,
  isLeader,
  canManage,
}: {
  record: { id: string; userId: string; fullName: string; cargo: string; areaLabel: string; salary: number };
  users: { id: string; name: string }[];
  isLeader: boolean;
  canManage: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="border-t border-border py-2 first:border-t-0">
        <SalaryRecordForm
          users={users}
          defaults={{
            userId: record.userId,
            fullName: record.fullName,
            cargo: record.cargo,
            areaLabel: record.areaLabel,
            salary: record.salary,
          }}
          onDone={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border py-2.5 first:border-t-0">
      <div className="flex flex-col">
        <span className="text-[13px] font-medium text-ink">
          {record.fullName}
          {isLeader && (
            <span className="ml-1.5 rounded-full bg-gold-tint px-2 py-0.5 text-[10px] font-medium text-gold-ink">
              Líder
            </span>
          )}
        </span>
        <span className="text-[11.5px] text-ink-faint">
          {record.cargo} · {record.areaLabel}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="tnum text-[13.5px] font-medium text-ink">{formatCurrency(record.salary)}</span>
        {canManage && (
          <>
            <button onClick={() => setEditing(true)} className="text-[11.5px] font-medium text-brand hover:underline">
              editar
            </button>
            <form
              action={deleteSalaryRecordAction}
              onSubmit={(e) => {
                if (!confirm(`Excluir o registro de ${record.fullName}?`)) e.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={record.id} />
              <button type="submit" className="text-[11.5px] text-ink-faint hover:text-critical">
                excluir
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
