"use client";

import { useState } from "react";
import { ATTENDEE_CATEGORY_META } from "@/lib/events";
import { EVENT_DYNAMIC_META } from "@/lib/sponsors";

const inputClass =
  "h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none";

export type AttendeeDefaults = {
  name?: string;
  empresa?: string | null;
  category?: string;
  ticketType?: string | null;
  email?: string | null;
  phone?: string | null;
  cpfRg?: string | null;
  instagram?: string | null;
  dynamicChoice?: string | null;
  dynamicOther?: string | null;
};

export function AttendeeFormFields({ defaults }: { defaults?: AttendeeDefaults }) {
  const [dynamicChoice, setDynamicChoice] = useState(defaults?.dynamicChoice ?? "");

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <input name="name" required defaultValue={defaults?.name} placeholder="Nome" className={inputClass} />
      <input name="empresa" defaultValue={defaults?.empresa ?? ""} placeholder="Empresa (opcional)" className={inputClass} />
      <select name="category" required defaultValue={defaults?.category ?? ""} className={inputClass}>
        <option value="" disabled>
          Categoria…
        </option>
        {Object.entries(ATTENDEE_CATEGORY_META).map(([key, meta]) => (
          <option key={key} value={key}>
            {meta.label}
          </option>
        ))}
      </select>
      <select name="ticketType" defaultValue={defaults?.ticketType ?? ""} className={inputClass}>
        <option value="">Ingresso: N/A</option>
        <option value="Gold">Gold</option>
        <option value="VIP">VIP</option>
      </select>
      <input name="email" type="email" defaultValue={defaults?.email ?? ""} placeholder="E-mail" className={inputClass} />
      <input name="phone" defaultValue={defaults?.phone ?? ""} placeholder="Telefone" className={inputClass} />
      <input name="cpfRg" defaultValue={defaults?.cpfRg ?? ""} placeholder="CPF/RG" className={inputClass} />
      <input name="instagram" defaultValue={defaults?.instagram ?? ""} placeholder="Instagram da marca" className={inputClass} />
      <select
        name="dynamicChoice"
        value={dynamicChoice}
        onChange={(e) => setDynamicChoice(e.target.value)}
        className={inputClass}
      >
        <option value="">Dinâmica: sem confirmação</option>
        {Object.entries(EVENT_DYNAMIC_META).map(([key, meta]) => (
          <option key={key} value={key}>
            {meta.label}
          </option>
        ))}
      </select>
      {dynamicChoice === "outro" && (
        <input
          name="dynamicOther"
          defaultValue={defaults?.dynamicOther ?? ""}
          placeholder="Qual dinâmica"
          className={`${inputClass} sm:col-span-2`}
        />
      )}
    </div>
  );
}
