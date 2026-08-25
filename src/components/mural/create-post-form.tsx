"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { createMuralPostAction, type ActionState } from "@/lib/actions/mural";

const initialState: ActionState = {};

export function CreatePostForm() {
  const [kind, setKind] = useState<"post" | "reconhecimento">("post");
  const [preview, setPreview] = useState<{ url: string; isVideo: boolean; name: string } | null>(
    null
  );
  const [state, formAction, pending] = useActionState(
    createMuralPostAction,
    initialState
  );
  const ref = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setKind("post");
      setPreview((p) => {
        if (p) URL.revokeObjectURL(p.url);
        return null;
      });
    }
  }, [state.success]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    if (!file) return;
    setPreview({
      url: URL.createObjectURL(file),
      isVideo: file.type.startsWith("video/"),
      name: file.name,
    });
  }

  function clearFile() {
    if (fileRef.current) fileRef.current.value = "";
    setPreview((p) => {
      if (p) URL.revokeObjectURL(p.url);
      return null;
    });
  }

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5"
    >
      <input type="hidden" name="kind" value={kind} />
      <textarea
        name="content"
        required
        rows={3}
        placeholder="Compartilhe uma novidade, um aprendizado ou uma conquista do time…"
        className="rounded-(--radius-s) border border-border bg-canvas p-3 text-[13.5px] outline-none focus:border-brand-deep-2"
      />

      {preview && (
        <div className="relative w-fit">
          {preview.isVideo ? (
            <video src={preview.url} className="max-h-48 rounded-(--radius-m) border border-border" controls />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.url}
              alt=""
              className="max-h-48 rounded-(--radius-m) border border-border object-cover"
            />
          )}
          <button
            type="button"
            onClick={clearFile}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[12px] text-canvas shadow-sm"
            aria-label="Remover"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <label className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-(--radius-s) border border-dashed border-border-strong bg-canvas px-3 text-[12.5px] text-ink-soft hover:bg-surface-muted">
          📷 {preview ? preview.name.slice(0, 24) : "Adicionar foto ou vídeo"}
          <input
            ref={fileRef}
            name="photo"
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <input
          name="linkUrl"
          placeholder="Link (opcional) — https://…"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setKind("post")}
            className={`rounded-full px-3 py-1 text-[12px] ${
              kind === "post"
                ? "bg-brand-deep text-gold-soft"
                : "bg-surface-muted text-ink-soft"
            }`}
          >
            Publicação
          </button>
          <button
            type="button"
            onClick={() => setKind("reconhecimento")}
            className={`rounded-full px-3 py-1 text-[12px] ${
              kind === "reconhecimento"
                ? "bg-brand-deep text-gold-soft"
                : "bg-surface-muted text-ink-soft"
            }`}
          >
            🏆 Reconhecimento
          </button>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-(--radius-s) bg-brand-deep px-4 text-[13px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Publicando…" : "Publicar"}
        </button>
      </div>
      {state.error && (
        <span className="text-[12px] text-critical">{state.error}</span>
      )}
    </form>
  );
}
