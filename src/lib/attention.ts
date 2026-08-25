export type AttentionPoint = {
  severity: "critical" | "warning";
  text: string;
  href: string;
  areaName: string;
};

export function buildAttentionPoints(input: {
  overdueTasks: { title: string; areaName: string; areaSlug: string }[];
  riskTasks: { title: string; areaName: string; areaSlug: string }[];
  lateProjects: { name: string; areaName: string; areaSlug: string }[];
  riskProjects: { name: string; areaName: string; areaSlug: string }[];
  belowTargetKpis: { name: string; areaName: string; areaSlug: string }[];
}): AttentionPoint[] {
  const points: AttentionPoint[] = [];

  for (const p of input.lateProjects) {
    points.push({
      severity: "critical",
      text: `Projeto "${p.name}" está atrasado`,
      href: `/areas/${p.areaSlug}`,
      areaName: p.areaName,
    });
  }

  if (input.overdueTasks.length > 0) {
    const byArea = groupCount(input.overdueTasks);
    for (const [areaSlug, { count, areaName }] of byArea) {
      points.push({
        severity: "critical",
        text: `${count} tarefa${count > 1 ? "s" : ""} atrasada${count > 1 ? "s" : ""}`,
        href: `/areas/${areaSlug}`,
        areaName,
      });
    }
  }

  for (const k of input.belowTargetKpis) {
    points.push({
      severity: "warning",
      text: `"${k.name}" está abaixo da meta`,
      href: `/areas/${k.areaSlug}`,
      areaName: k.areaName,
    });
  }

  for (const p of input.riskProjects) {
    points.push({
      severity: "warning",
      text: `Projeto "${p.name}" está em risco`,
      href: `/areas/${p.areaSlug}`,
      areaName: p.areaName,
    });
  }

  if (input.riskTasks.length > 0) {
    const byArea = groupCount(input.riskTasks);
    for (const [areaSlug, { count, areaName }] of byArea) {
      points.push({
        severity: "warning",
        text: `${count} tarefa${count > 1 ? "s" : ""} em risco`,
        href: `/areas/${areaSlug}`,
        areaName,
      });
    }
  }

  return points.sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1
  );
}

function groupCount(items: { areaName: string; areaSlug: string }[]) {
  const map = new Map<string, { count: number; areaName: string }>();
  for (const item of items) {
    const existing = map.get(item.areaSlug);
    if (existing) existing.count++;
    else map.set(item.areaSlug, { count: 1, areaName: item.areaName });
  }
  return map;
}
