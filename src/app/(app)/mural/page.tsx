import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreatePostForm } from "@/components/mural/create-post-form";
import { PostCard } from "@/components/mural/post-card";
import { CultureBanner } from "@/components/dashboard/culture-banner";

export default async function MuralPage() {
  const user = await requireUser();

  const posts = await prisma.muralPost.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: true,
      reactions: true,
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-8">
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="O time que celebra junto, cresce junto."
        subtitle="Cada post é um registro da nossa história — compartilhe o que te orgulha, reconheça quem fez acontecer."
      />

      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
          Conhecimento
        </p>
        <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
          Jornal BL
        </h1>
        <p className="text-[13px] text-ink-soft">
          O jornal da Brand Legacy — compartilhe o que está rolando, comente,
          reaja e suba fotos e vídeos do time em ação.
        </p>
      </div>

      <CreatePostForm />

      <div className="flex flex-col gap-5">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} currentUserId={user.id} />
        ))}
        {posts.length === 0 && (
          <p className="text-[13px] text-ink-faint">
            Ainda não há publicações. Seja o primeiro a compartilhar algo!
          </p>
        )}
      </div>
    </div>
  );
}
