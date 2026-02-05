/** Shared color palette for categories. Uncategorized uses a distinct color. */

export const CATEGORY_COLORS = [
  { value: "blue", bg: "bg-blue-50 dark:bg-blue-900/30", ring: "ring-blue-500" },
  { value: "red", bg: "bg-red-50 dark:bg-red-900/30", ring: "ring-red-500" },
  { value: "green", bg: "bg-green-50 dark:bg-green-900/30", ring: "ring-green-500" },
  { value: "orange", bg: "bg-orange-50 dark:bg-orange-900/30", ring: "ring-orange-500" },
  { value: "purple", bg: "bg-purple-50 dark:bg-purple-900/30", ring: "ring-purple-500" },
  { value: "pink", bg: "bg-pink-50 dark:bg-pink-900/30", ring: "ring-pink-500" },
  { value: "yellow", bg: "bg-yellow-50 dark:bg-yellow-900/30", ring: "ring-yellow-500" },
  { value: "cyan", bg: "bg-cyan-50 dark:bg-cyan-900/30", ring: "ring-cyan-500" },
] as const;

/** Background class for uncategorized entries (not in category color list). */
export const UNCATEGORIZED_BG = "bg-slate-100 dark:bg-slate-800";

export function getCategoryBgClass(color?: string): string {
  const found = CATEGORY_COLORS.find((c) => c.value === color);
  return found?.bg ?? UNCATEGORIZED_BG;
}
