import type { DbProject } from "@/lib/cms";

/** Stable, URL-safe slug derived from a project's code (falls back to title). */
export function projectSlug(p: Pick<DbProject, "code" | "title">): string {
  const base = p.code || p.title;
  return base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
