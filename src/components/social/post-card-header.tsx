"use client";

import { useState } from "react";
import { CONTENT_FORMAT_META, CONTENT_POST_STATUS_META } from "@/lib/social";
import { formatDate } from "@/lib/format";
import { EditContentPostForm } from "@/components/social/edit-content-post-form";
import { DeleteContentPostButton } from "@/components/social/delete-content-post-button";

export function PostCardHeader({
  post,
  profiles,
  canEdit,
}: {
  post: {
    id: string;
    date: Date;
    profileId: string;
    profileName: string;
    format: string;
    theme: string;
    status: string;
    notes: string | null;
  };
  profiles: { id: string; name: string }[];
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <EditContentPostForm post={post} profiles={profiles} onDone={() => setEditing(false)} />;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="w-fit rounded-full bg-gold-tint px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.04em] text-gold-ink">
        {CONTENT_FORMAT_META[post.format as keyof typeof CONTENT_FORMAT_META].label} · {post.profileName}
      </span>
      <h2 className="font-(family-name:--font-display) text-[20px] leading-tight text-ink">{post.theme}</h2>
      <p className="text-[12.5px] text-ink-faint">
        {formatDate(post.date)} · {CONTENT_POST_STATUS_META[post.status as keyof typeof CONTENT_POST_STATUS_META].label}
      </p>
      {post.notes && (
        <p className="mt-1 rounded-(--radius-s) bg-surface-muted p-3 text-[12.5px] leading-relaxed text-ink-soft">
          {post.notes}
        </p>
      )}
      {canEdit && (
        <div className="mt-1 flex items-center gap-3">
          <button
            onClick={() => setEditing(true)}
            className="text-[12px] font-medium text-brand hover:underline"
          >
            Editar post
          </button>
          <DeleteContentPostButton postId={post.id} />
        </div>
      )}
    </div>
  );
}
