export const LIBRARY_CATEGORIES = [
  "Liderança",
  "Gestão",
  "Estratégia",
  "Comercial",
  "Marketing",
  "Social",
  "Finanças",
  "Operações",
  "CS",
  "Cultura",
  "Desenvolvimento pessoal",
] as const;

export const CATEGORY_ICON: Record<string, string> = {
  "Liderança": "🧭",
  "Gestão": "📊",
  "Estratégia": "🎯",
  "Comercial": "💼",
  "Marketing": "📣",
  "Social": "📱",
  "Finanças": "💰",
  "Operações": "⚙️",
  "CS": "🤝",
  "Cultura": "🌱",
  "Desenvolvimento pessoal": "🌟",
};

export function categoryIcon(category: string) {
  return CATEGORY_ICON[category] ?? "📚";
}

export const LIBRARY_TYPES: { value: string; label: string; icon: string }[] = [
  { value: "video", label: "Vídeo", icon: "▶" },
  { value: "livro", label: "Livro", icon: "📕" },
  { value: "artigo", label: "Artigo", icon: "📰" },
  { value: "pdf", label: "PDF", icon: "📄" },
  { value: "apresentacao", label: "Apresentação", icon: "🖥" },
  { value: "podcast", label: "Podcast", icon: "🎙" },
  { value: "link", label: "Link", icon: "🔗" },
  { value: "material", label: "Material interno", icon: "🗂" },
];

export function libraryTypeLabel(value: string) {
  return LIBRARY_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function libraryTypeIcon(value: string) {
  return LIBRARY_TYPES.find((t) => t.value === value)?.icon ?? "📄";
}
