"use client";

import { useRouter } from "next/navigation";
import { deleteLeadAction } from "@/lib/actions/crm";

export function DeleteLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();

  return (
    <form
      action={async (formData) => {
        await deleteLeadAction(formData);
        router.push("/comercial/crm");
      }}
      onSubmit={(e) => {
        if (!confirm("Excluir este lead? Essa ação não pode ser desfeita.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="leadId" value={leadId} />
      <button className="text-[12px] font-medium text-critical hover:underline">Excluir lead</button>
    </form>
  );
}
