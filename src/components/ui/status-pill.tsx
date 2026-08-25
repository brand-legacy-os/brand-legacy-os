const TONE_CLASSES = {
  positive: "bg-positive-bg text-positive",
  warning: "bg-warning-bg text-warning",
  critical: "bg-critical-bg text-critical",
  neutral: "bg-surface-muted text-ink-soft",
} as const;

export type Tone = keyof typeof TONE_CLASSES;

export function StatusPill({
  label,
  tone,
  className = "",
}: {
  label: string;
  tone: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-medium ${TONE_CLASSES[tone]} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function kpiStatusTone(
  status: "atingida" | "no_ritmo" | "atencao" | "abaixo" | null
): Tone {
  switch (status) {
    case "atingida":
    case "no_ritmo":
      return "positive";
    case "atencao":
      return "warning";
    case "abaixo":
      return "critical";
    default:
      return "neutral";
  }
}

export function taskStatusTone(
  status: "no_ritmo" | "atencao" | "atrasada" | "pausada" | "cancelada" | "concluida"
): Tone {
  switch (status) {
    case "no_ritmo":
    case "concluida":
      return "positive";
    case "atencao":
      return "warning";
    case "atrasada":
      return "critical";
    default:
      return "neutral";
  }
}

export function priorityTone(
  priority: "baixa" | "media" | "alta" | "urgente"
): Tone {
  switch (priority) {
    case "urgente":
      return "critical";
    case "alta":
      return "warning";
    case "media":
      return "neutral";
    default:
      return "neutral";
  }
}

export function payableStatusTone(
  status: "pago" | "atrasado" | "vencendo_hoje" | "a_vencer" | "cancelado"
): Tone {
  switch (status) {
    case "pago":
      return "positive";
    case "atrasado":
      return "critical";
    case "vencendo_hoje":
      return "warning";
    default:
      return "neutral";
  }
}

export function receivableStatusTone(
  status: "recebido" | "parcial" | "atrasado" | "a_receber" | "cancelado"
): Tone {
  switch (status) {
    case "recebido":
      return "positive";
    case "atrasado":
      return "critical";
    case "parcial":
      return "warning";
    default:
      return "neutral";
  }
}

export function projectStatusTone(
  status: "no_ritmo" | "risco" | "atrasado" | "pausado" | "concluido"
): Tone {
  switch (status) {
    case "no_ritmo":
    case "concluido":
      return "positive";
    case "risco":
      return "warning";
    case "atrasado":
      return "critical";
    default:
      return "neutral";
  }
}
