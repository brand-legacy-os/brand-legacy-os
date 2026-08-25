import Link from "next/link";
import { prisma } from "@/lib/db";
import { relativeTime } from "@/lib/format";
import type { SessionUser } from "@/lib/auth";
import { logoutAction } from "@/app/(app)/actions";
import { getUpcomingDeadlineReminders } from "@/lib/reminders";

export async function Topbar({ user }: { user: SessionUser }) {
  const [notifications, reminders] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    getUpcomingDeadlineReminders(user.id),
  ]);
  const unread = notifications.filter((n) => !n.read).length + reminders.length;
  const primaryTitle = user.memberships[0]?.title ?? user.title;

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-canvas/90 px-8 backdrop-blur-sm">
      <div />
      <div className="flex items-center gap-2">
        <details className="group relative">
          <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface-muted [&::-webkit-details-marker]:hidden">
            <span className="relative">
              <BellIcon />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-brand-deep">
                  {unread}
                </span>
              )}
            </span>
          </summary>
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-(--radius-m) border border-border bg-surface p-2 shadow-[0_12px_32px_-16px_rgba(16,32,26,0.3)]">
            <div className="flex items-center justify-between px-2 py-1.5">
              <p className="text-[12.5px] font-medium text-ink">Notificações</p>
              <Link
                href="/notificacoes"
                className="text-[12px] text-brand hover:underline"
              >
                Ver todas
              </Link>
            </div>
            <div className="flex flex-col">
              {notifications.length === 0 && reminders.length === 0 && (
                <p className="px-2 py-4 text-center text-[12.5px] text-ink-faint">
                  Nenhuma notificação por aqui.
                </p>
              )}
              {reminders.map((r) => (
                <Link
                  key={r.id}
                  href={r.link}
                  className="flex flex-col gap-0.5 rounded-(--radius-s) px-2.5 py-2 text-left transition-colors hover:bg-warning-bg"
                >
                  <span className="text-[12.5px] leading-snug text-ink">
                    ⏰ {r.message}
                  </span>
                </Link>
              ))}
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? "/notificacoes"}
                  className="flex flex-col gap-0.5 rounded-(--radius-s) px-2.5 py-2 text-left transition-colors hover:bg-surface-muted"
                >
                  <span className="text-[12.5px] leading-snug text-ink">
                    {n.message}
                  </span>
                  <span className="text-[11px] text-ink-faint">
                    {relativeTime(n.createdAt)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </details>

        <details className="group relative">
          <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-full py-1 pl-1.5 pr-3 transition-colors hover:bg-surface-muted [&::-webkit-details-marker]:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-deep text-[12px] font-semibold text-gold-soft">
              {user.avatarInitials}
            </span>
            <span className="flex flex-col items-start leading-tight">
              <span className="text-[13px] font-medium text-ink">
                {user.name}
              </span>
              <span className="text-[11px] text-ink-faint">{primaryTitle}</span>
            </span>
          </summary>
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-(--radius-m) border border-border bg-surface p-1.5 shadow-[0_12px_32px_-16px_rgba(16,32,26,0.3)]">
            <Link
              href={`/perfil/${user.id}`}
              className="block rounded-(--radius-s) px-3 py-2 text-[13px] text-ink transition-colors hover:bg-surface-muted"
            >
              Meu perfil
            </Link>
            <Link
              href="/notificacoes"
              className="block rounded-(--radius-s) px-3 py-2 text-[13px] text-ink transition-colors hover:bg-surface-muted"
            >
              Notificações
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="block w-full rounded-(--radius-s) px-3 py-2 text-left text-[13px] text-critical transition-colors hover:bg-critical-bg"
              >
                Sair
              </button>
            </form>
          </div>
        </details>
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 9a6 6 0 1 1 12 0c0 3.2 1 5 1.6 5.8.3.4 0 1.2-.6 1.2H5c-.6 0-.9-.8-.6-1.2C5 14 6 12.2 6 9Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 18.5a2.5 2.5 0 0 0 5 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
