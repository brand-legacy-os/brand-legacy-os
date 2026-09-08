import { redirect } from "next/navigation";

// A subárea "Por colaborador" virou um mini-dashboard dentro de Tarefas
// (planejado × realizado, acima da lista por colaborador) em vez de uma
// aba própria — este redirect só cobre links/favoritos antigos.
export default function SocialColaboradoresRedirect() {
  redirect("/social/tarefas");
}
