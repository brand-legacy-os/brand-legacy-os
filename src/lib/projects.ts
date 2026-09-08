// Tipo de iniciativa de um Project — string livre no banco (não enum) pra
// permitir adicionar tipos futuros sem migração, mesmo padrão de PRODUCTS.
export const PROJECT_KINDS = [
  "Projeto",
  "Evento",
  "Lançamento",
  "Coquetel",
  "Aula",
  "Webinar",
  "Hot Seat",
  "Outro",
] as const;
