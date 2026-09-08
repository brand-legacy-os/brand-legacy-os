"use client";

import { useState } from "react";
import { LeadSaleForm } from "./lead-sale-form";
import { formatCurrency, formatDate } from "@/lib/format";

export function LeadSaleCell({
  leadId,
  saleProduct,
  saleValue,
  saleDate,
  canEdit,
}: {
  leadId: string;
  saleProduct: string | null;
  saleValue: number | null;
  saleDate: Date | string | null;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <LeadSaleForm
        leadId={leadId}
        defaults={{ saleProduct, saleValue, saleDate }}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      {saleProduct || saleValue ? (
        <span className="text-[12.5px] text-ink-soft">
          {saleProduct ?? "—"}
          {saleValue ? ` · ${formatCurrency(saleValue)}` : ""}
          {saleDate ? ` · ${formatDate(new Date(saleDate))}` : ""}
        </span>
      ) : (
        <span className="text-[12px] text-ink-faint">Sem venda</span>
      )}
      {canEdit && (
        <button onClick={() => setEditing(true)} className="text-[11px] font-medium text-brand hover:underline">
          {saleProduct || saleValue ? "editar" : "+ venda"}
        </button>
      )}
    </div>
  );
}
