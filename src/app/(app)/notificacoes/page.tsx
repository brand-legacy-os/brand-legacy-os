import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getUpcomingDeadlineReminders } from "@/lib/reminders";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";

export default async function NotificationsPage() {
  const user = await requireUser();
  const [notifications, reminders] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    getUpcomingDeadlineReminders(user.id),
  ]);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
            Central de notificações
          </p>
          <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
            Notificações
          </h1>
        </div>
        {unread > 0 && (
          <form action={markAllNotificationsReadAction}>
            <button className="text-[12.5px] font-medium text-brand hover:underline">
              Marcar todas como lidas
            </button>
          </form>
        )}
      </div>

      {reminders.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-ink-faint">
            Prazos próximos
          </p>
          {reminders.map((r) => (
            <Link
              key={r.id}
              href={r.link}
              className="flex items-center gap-3 rounded-(--radius-l) border border-warning-bg bg-warning-bg/60 p-4 hover:bg-warning-bg"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-warning" />
              <span className="text-[13.5px] text-ink">{r.message}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-center gap-3 rounded-(--radius-l) border p-4 ${
              n.read
                ? "border-border bg-surface"
                : "border-brand-deep-2/30 bg-gold-tint/40"
            }`}
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-border-strong" : "bg-gold"}`}
            />
            <div className="flex flex-1 flex-col gap-0.5">
              {n.link ? (
                <Link href={n.link} className="text-[13.5px] text-ink hover:underline">
                  {n.message}
                </Link>
              ) : (
                <span className="text-[13.5px] text-ink">{n.message}</span>
              )}
              <span className="text-[11.5px] text-ink-faint">
                {formatDateTime(n.createdAt)}
              </span>
            </div>
            {!n.read && (
              <form action={markNotificationReadAction}>
                <input type="hidden" name="id" value={n.id} />
                <button className="text-[11.5px] text-ink-faint hover:text-brand hover:underline">
                  Marcar como lida
                </button>
              </form>
            )}
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="text-[13px] text-ink-faint">
            Nenhuma notificação por aqui ainda.
          </p>
        )}
      </div>
    </div>
  );
}
