# Brand Legacy OS

Plataforma interna de gestão da Brand Legacy: dashboard executivo, indicadores por área, projetos e tarefas, biblioteca de conhecimento e mural interno.

## Rodando localmente

```bash
npm install
npm run db:seed   # popula o banco local (SQLite) com a estrutura atual da empresa
npm run dev
```

Acesse http://localhost:3000. Todas as contas usam a senha de demonstração:

```
BrandLegacy@2026
```

Alguns e-mails para testar diferentes níveis de acesso:

- `operacoes@brandlegacy.com.br` — Marcus, administrador (visão global)
- `nubia@brandlegacy.com.br` — Núbia, líder de Gestão de Projetos (visão cross-área de projetos)
- `karina@brandlegacy.com.br` — Karina, líder Comercial
- `renzo@brandlegacy.com.br` — Renzo, colaborador Comercial (acesso restrito à própria área)
- `igor@brandlegacy.com.br` — Igor, com dois vínculos: colaborador em Social e líder de Eventos

## Stack

- **Next.js 16** (App Router, Turbopack, Server Actions) + TypeScript
- **Tailwind CSS v4** com tokens de marca definidos em `src/app/globals.css`
- **Prisma + SQLite** (`prisma/schema.prisma`) — trocar para Postgres em produção é só mudar o `provider` e o `DATABASE_URL`
- Autenticação própria (e-mail + senha, cookie assinado com `jose`), restrita a `@brandlegacy.com.br` — pronta para ser trocada por Google Workspace OAuth mantendo a mesma modelagem de sessão

## Estrutura

- `prisma/schema.prisma` — modelo de dados (usuários, vínculos pessoa→área→cargo, KPIs + histórico, projetos, tarefas, biblioteca, mural, notificações, auditoria)
- `prisma/seed.ts` — estrutura organizacional atual da empresa e dados de exemplo
- `src/lib/permissions.ts` — regras de acesso por papel (admin / líder / colaborador)
- `src/lib/actions/*` — Server Actions (mutações): KPIs, tarefas, biblioteca, mural, notificações
- `src/app/(app)/*` — páginas autenticadas (dashboard, áreas, projetos, biblioteca, mural, perfil, notificações, configurações)

## O que já funciona de ponta a ponta

Líder preenche um KPI → o valor é salvo com histórico → o indicador da área é atualizado → o Dashboard reflete automaticamente, com atingimento de meta e pontos de atenção recalculados.

## Próximos passos sugeridos

- Login real com Google Workspace (OAuth), substituindo e-mail/senha
- Painel de administração para cadastrar áreas, KPIs e permissões pela interface (hoje via `prisma/seed.ts`)
- Deploy (banco Postgres gerenciado + hospedagem) e domínio definitivo
- Upload de arquivos na Biblioteca e no Mural (hoje são apenas links)
