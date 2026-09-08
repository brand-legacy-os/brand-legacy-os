import { redirect } from "next/navigation";

// Workflow agora vive dentro de Projetos e Tarefas — mantido como redirect
// pra não quebrar links/favoritos antigos.
export default function WorkflowRedirectPage() {
  redirect("/projetos/workflow");
}
