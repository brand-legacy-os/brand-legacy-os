import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  LIBRARY_CATEGORIES,
  LIBRARY_TYPES,
  libraryTypeIcon,
  libraryTypeLabel,
  categoryIcon,
} from "@/lib/library";
import { formatDate } from "@/lib/format";
import { AddLibraryForm } from "@/components/library/add-library-form";

export default async function BibliotecaPage({
  searchParams,
}: PageProps<"/biblioteca">) {
  await requireUser();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const category = typeof sp.categoria === "string" ? sp.categoria : "";
  const type = typeof sp.tipo === "string" ? sp.tipo : "";

  const [items, allItems] = await Promise.all([
    prisma.libraryItem.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(type ? { type } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { tags: { contains: q } },
                { authorLabel: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.libraryItem.findMany({ select: { category: true } }),
  ]);

  const countByCategory = new Map<string, number>();
  for (const i of allItems) {
    countByCategory.set(i.category, (countByCategory.get(i.category) ?? 0) + 1);
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
            Conhecimento
          </p>
          <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
            Biblioteca
          </h1>
          <p className="max-w-[62ch] text-[13px] text-ink-soft">
            O acervo de conhecimento da Brand Legacy — artigos, livros, vídeos
            e podcasts por tema, para consumir e para montar o PDI de cada
            colaborador.
          </p>
        </div>
        <AddLibraryForm />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/biblioteca"
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
            !category
              ? "border-brand-deep bg-brand-deep text-gold-soft"
              : "border-border bg-surface text-ink-soft hover:bg-surface-muted"
          }`}
        >
          Todos os temas
          <span className="tnum">{allItems.length}</span>
        </Link>
        {LIBRARY_CATEGORIES.map((c) => {
          const count = countByCategory.get(c) ?? 0;
          const active = category === c;
          return (
            <Link
              key={c}
              href={`/biblioteca?categoria=${encodeURIComponent(c)}`}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                active
                  ? "border-brand-deep bg-brand-deep text-gold-soft"
                  : "border-border bg-surface text-ink-soft hover:bg-surface-muted"
              }`}
            >
              <span>{categoryIcon(c)}</span>
              {c}
              <span className="tnum">{count}</span>
            </Link>
          );
        })}
      </div>

      <form className="flex flex-wrap items-center gap-2.5" method="get">
        {category && <input type="hidden" name="categoria" value={category} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por título, tag ou autor…"
          className="h-9 min-w-[220px] flex-1 rounded-full border border-border bg-surface px-4 text-[13px] outline-none focus:border-brand-deep-2"
        />
        <select
          name="tipo"
          defaultValue={type}
          className="h-9 rounded-full border border-border bg-surface px-3.5 text-[12.5px] text-ink-soft outline-none"
        >
          <option value="">Todos os tipos</option>
          {LIBRARY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.icon} {t.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-9 rounded-full bg-surface-muted px-4 text-[12.5px] font-medium text-ink-soft hover:bg-border-strong/40"
        >
          Filtrar
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-4 transition-colors hover:border-brand-deep-2 hover:shadow-[0_8px_24px_-16px_rgba(16,32,26,0.35)]"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-(--radius-s) bg-surface-muted text-[18px]">
                {libraryTypeIcon(item.type)}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-gold-tint px-2.5 py-0.5 text-[10.5px] font-medium text-gold-ink">
                <span>{categoryIcon(item.category)}</span>
                {item.category}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[14px] font-medium leading-snug text-ink">
                {item.title}
              </span>
              <span className="line-clamp-2 text-[12px] text-ink-soft">
                {item.description}
              </span>
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-border pt-2.5 text-[11.5px] text-ink-faint">
              <span>
                {libraryTypeLabel(item.type)} · {item.authorLabel}
              </span>
              <span>{formatDate(item.createdAt)}</span>
            </div>
          </a>
        ))}
        {items.length === 0 && (
          <p className="text-[13px] text-ink-faint">
            Nada encontrado com esses filtros ainda.
          </p>
        )}
      </div>
    </>
  );
}
