"use client";

export function AutoSubmitSelect({
  action,
  hiddenName,
  hiddenValue,
  name,
  defaultValue,
  options,
}: {
  action: (formData: FormData) => void;
  hiddenName: string;
  hiddenValue: string;
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <form action={action} className="inline">
      <input type="hidden" name={hiddenName} value={hiddenValue} />
      <select
        name={name}
        defaultValue={defaultValue}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-7 rounded-full border border-border bg-surface px-2 text-[11.5px] outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}
