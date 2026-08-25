"use client";

import { useActionState, useRef, useEffect } from "react";
import { addCommentAction, type ActionState } from "@/lib/actions/mural";

const initialState: ActionState = {};

export function CommentForm({ postId }: { postId: string }) {
  const [state, formAction, pending] = useActionState(
    addCommentAction,
    initialState
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) ref.current?.reset();
  }, [state.success]);

  return (
    <form ref={ref} action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="postId" value={postId} />
      <input
        name="content"
        placeholder="Escreva um comentário…"
        className="h-8 flex-1 rounded-full border border-border bg-canvas px-3.5 text-[12.5px] outline-none focus:border-brand-deep-2"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-[12px] font-medium text-brand disabled:opacity-50"
      >
        Enviar
      </button>
      {state.error && (
        <span className="text-[11.5px] text-critical">{state.error}</span>
      )}
    </form>
  );
}
