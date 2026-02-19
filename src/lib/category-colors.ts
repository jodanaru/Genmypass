/** Shared color palette for categories. Uncategorized uses a distinct color. */

export const CATEGORY_COLORS = [
  { value: "blue",   bg: "bg-blue-100 dark:bg-blue-900/50",       text: "text-blue-600 dark:text-blue-400",       swatch: "bg-blue-500",    ring: "ring-blue-500" },
  { value: "red",    bg: "bg-red-100 dark:bg-red-900/50",         text: "text-red-600 dark:text-red-400",         swatch: "bg-red-500",     ring: "ring-red-500" },
  { value: "green",  bg: "bg-emerald-100 dark:bg-emerald-900/50", text: "text-emerald-600 dark:text-emerald-400", swatch: "bg-emerald-500", ring: "ring-emerald-500" },
  { value: "orange", bg: "bg-orange-100 dark:bg-orange-900/50",   text: "text-orange-600 dark:text-orange-400",   swatch: "bg-orange-500",  ring: "ring-orange-500" },
  { value: "purple", bg: "bg-violet-100 dark:bg-violet-900/50",   text: "text-violet-600 dark:text-violet-400",   swatch: "bg-violet-500",  ring: "ring-violet-500" },
  { value: "pink",   bg: "bg-pink-100 dark:bg-pink-900/50",       text: "text-pink-600 dark:text-pink-400",       swatch: "bg-pink-500",    ring: "ring-pink-500" },
  { value: "yellow", bg: "bg-amber-100 dark:bg-amber-800/50",     text: "text-amber-600 dark:text-amber-400",     swatch: "bg-amber-500",   ring: "ring-amber-500" },
  { value: "cyan",   bg: "bg-cyan-100 dark:bg-cyan-900/50",       text: "text-cyan-600 dark:text-cyan-400",       swatch: "bg-cyan-500",    ring: "ring-cyan-500" },
] as const;

export const UNCATEGORIZED_BG = "bg-slate-100 dark:bg-slate-800";
export const UNCATEGORIZED_TEXT = "text-slate-500 dark:text-slate-400";

export function getCategoryBgClass(color?: string): string {
  const found = CATEGORY_COLORS.find((c) => c.value === color);
  return found?.bg ?? UNCATEGORIZED_BG;
}

export function getCategoryTextClass(color?: string): string {
  const found = CATEGORY_COLORS.find((c) => c.value === color);
  return found?.text ?? UNCATEGORIZED_TEXT;
}
