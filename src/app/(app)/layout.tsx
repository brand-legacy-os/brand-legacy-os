import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildNav } from "@/lib/nav";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const areas = await prisma.area.findMany({
    select: { slug: true, name: true },
  });
  const pendingApprovals = await prisma.notification.count({
    where: { userId: user.id, read: false, type: "aprovacao" },
  });

  const groups = buildNav(user, areas, pendingApprovals);

  return (
    <div className="flex min-h-screen">
      <Sidebar groups={groups} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 px-8 py-8">
          <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
