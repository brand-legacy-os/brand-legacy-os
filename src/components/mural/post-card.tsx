import { relativeTime } from "@/lib/format";
import { toggleReactionAction } from "@/lib/actions/mural";
import { REACTION_EMOJIS } from "@/lib/mural";
import { CommentForm } from "./comment-form";

const KIND_BADGE: Record<string, string> = {
  reconhecimento: "Reconhecimento",
};

export function PostCard({
  post,
  currentUserId,
}: {
  post: {
    id: string;
    content: string;
    linkUrl: string | null;
    imageUrl: string | null;
    kind: string;
    createdAt: Date;
    author: { name: string; avatarInitials: string; title: string };
    reactions: { userId: string; emoji: string }[];
    comments: {
      id: string;
      content: string;
      createdAt: Date;
      author: { name: string; avatarInitials: string };
    }[];
  };
  currentUserId: string;
}) {
  const myReaction = post.reactions.find((r) => r.userId === currentUserId)?.emoji;
  const counts = new Map<string, number>();
  for (const r of post.reactions) {
    counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1);
  }

  return (
    <article className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-deep text-[11.5px] font-semibold text-gold-soft">
          {post.author.avatarInitials}
        </span>
        <div className="flex flex-col">
          <span className="text-[13.5px] font-medium text-ink">
            {post.author.name}
          </span>
          <span className="text-[11.5px] text-ink-faint">
            {post.author.title} · {relativeTime(post.createdAt)}
          </span>
        </div>
        {post.kind === "reconhecimento" && (
          <span className="ml-auto rounded-full bg-gold-tint px-2.5 py-1 text-[10.5px] font-medium text-gold-ink">
            {KIND_BADGE[post.kind]}
          </span>
        )}
      </div>

      <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink">
        {post.content}
      </p>

      {post.imageUrl && (
        /\.(mp4|webm|mov|m4v)$/i.test(post.imageUrl) ? (
          <video
            src={post.imageUrl}
            controls
            className="max-h-[420px] w-full rounded-(--radius-m) border border-border"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.imageUrl}
            alt=""
            className="max-h-[420px] w-full rounded-(--radius-m) border border-border object-cover"
          />
        )
      )}

      {post.linkUrl && (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit rounded-(--radius-s) border border-border bg-surface-muted px-3 py-2 text-[12.5px] text-brand hover:underline"
        >
          {post.linkUrl}
        </a>
      )}

      <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
        {REACTION_EMOJIS.map((emoji) => {
          const count = counts.get(emoji) ?? 0;
          const mine = myReaction === emoji;
          if (count === 0 && !mine) return null;
          return (
            <form key={emoji} action={toggleReactionAction}>
              <input type="hidden" name="postId" value={post.id} />
              <input type="hidden" name="emoji" value={emoji} />
              <button
                type="submit"
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] transition-colors ${
                  mine ? "bg-gold-tint text-gold-ink" : "bg-surface-muted text-ink-soft hover:bg-border-strong/30"
                }`}
              >
                {emoji} <span className="tnum">{count}</span>
              </button>
            </form>
          );
        })}
        <details className="group relative">
          <summary className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-full text-[13px] text-ink-faint hover:bg-surface-muted [&::-webkit-details-marker]:hidden">
            +
          </summary>
          <div className="absolute left-0 z-10 mt-1 flex gap-1 rounded-full border border-border bg-surface p-1 shadow-[0_8px_20px_-8px_rgba(16,32,26,0.3)]">
            {REACTION_EMOJIS.map((emoji) => (
              <form key={emoji} action={toggleReactionAction}>
                <input type="hidden" name="postId" value={post.id} />
                <input type="hidden" name="emoji" value={emoji} />
                <button
                  type="submit"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[14px] hover:bg-surface-muted"
                >
                  {emoji}
                </button>
              </form>
            ))}
          </div>
        </details>
        <span className="ml-auto text-[12.5px] text-ink-faint">
          {post.comments.length} comentário
          {post.comments.length === 1 ? "" : "s"}
        </span>
      </div>

      {post.comments.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          {post.comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[9.5px] font-medium text-ink-soft">
                {c.author.avatarInitials}
              </span>
              <p className="text-[12.5px] leading-snug text-ink">
                <span className="font-medium">{c.author.name}</span>{" "}
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}

      <CommentForm postId={post.id} />
    </article>
  );
}
