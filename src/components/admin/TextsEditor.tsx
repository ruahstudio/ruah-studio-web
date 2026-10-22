import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Languages, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CONTENT_LANGS, STUDIO_DEFAULTS, STUDIO_FIELDS } from "@/lib/cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageField } from "@/components/admin/ResourceManager";

type Lang = (typeof CONTENT_LANGS)[number];

/** The `studio_content` columns this editor reads and writes. */
const COLUMNS = ["key", ...CONTENT_LANGS.map((l) => `value${l.suffix}`)].join(", ");

/**
 * The studio's own copy — hero, pillars, form headings, contact details.
 *
 * It used to offer English and Spanish only, while the site serves seven
 * languages: whatever John wrote here reached pt/fr/de/it/ar visitors in
 * English, with nothing in the panel to say so. Now one language is edited at
 * a time, and only the fields that are actually sentences get a per-language
 * value — a WhatsApp number does not need translating.
 */
export function TextsEditor() {
  const qc = useQueryClient();
  const [lang, setLang] = useState<Lang>(CONTENT_LANGS[0]);
  // key -> column -> value
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [dirty, setDirty] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "studio_content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("studio_content").select(COLUMNS);
      if (error) throw error;
      const map: Record<string, Record<string, string>> = {};
      for (const f of STUDIO_FIELDS) map[f.key] = { value: STUDIO_DEFAULTS[f.key] ?? "" };
      for (const row of (data ?? []) as unknown as Record<string, string>[]) {
        const key = row["key"];
        if (!key) continue;
        const entry: Record<string, string> = {};
        for (const l of CONTENT_LANGS) {
          const col = `value${l.suffix}`;
          entry[col] = row[col] ?? "";
        }
        map[key] = entry;
      }
      return map;
    },
  });

  useEffect(() => {
    if (data) {
      setValues(data);
      setDirty(false);
    }
  }, [data]);

  const column = `value${lang.suffix}`;
  const read = (key: string) => values[key]?.[column] ?? "";
  const write = (key: string, value: string) => {
    setValues((v) => ({ ...v, [key]: { ...(v[key] ?? {}), [column]: value } }));
    setDirty(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const rows = STUDIO_FIELDS.map((f) => {
        const row: Record<string, string> = { key: f.key };
        for (const l of CONTENT_LANGS) {
          const col = `value${l.suffix}`;
          // Only translatable fields carry per-language values; the rest keep
          // the single base column.
          if (l.suffix && !f.i18n) continue;
          row[col] = values[f.key]?.[col] ?? "";
        }
        return row;
      });
      const { error } = await supabase
        .from("studio_content")
        .upsert(rows as never, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Guardado");
      setDirty(false);
      void qc.invalidateQueries({ queryKey: ["admin", "studio_content"] });
      void qc.invalidateQueries({ queryKey: ["cms"] });
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Cargando...
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Textos del estudio</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Promesa, pilares, subtítulos y datos de contacto del sitio público.
          </p>
        </div>
        <Button
          onClick={() => save.mutate()}
          disabled={save.isPending || !dirty}
          className="font-mono text-xs uppercase tracking-widest"
        >
          {save.isPending ? (
            <Loader2 className="mr-1 size-4 animate-spin" />
          ) : (
            <Save className="mr-1 size-4" />
          )}
          {dirty ? "Guardar cambios" : "Sin cambios"}
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-y border-border py-3">
        <Languages className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="label-mono me-2">Idioma</span>
        {CONTENT_LANGS.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={lang.code === l.code}
            className={`border px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest transition-colors ${
              lang.code === l.code
                ? "border-signal bg-signal text-signal-foreground"
                : "border-border bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {l.label}
          </button>
        ))}
        <span className="ms-auto text-xs text-muted-foreground">
          {lang.code === "en"
            ? "El inglés es la base: si un idioma queda vacío, el sitio muestra este."
            : "Si lo dejas vacío, el sitio muestra el inglés en este idioma."}
        </span>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {STUDIO_FIELDS.map((f) => {
          // A field without translations is only editable on the base
          // language, so there is no doubt about which value is live.
          const shared = !f.i18n;
          if (shared && lang.suffix) return null;
          const id = `${f.key}${lang.suffix}`;
          return (
            <div
              key={f.key}
              className={`space-y-2 rounded-2xl border border-border bg-card p-5 ${
                f.multiline || f.key === "photo_url" ? "md:col-span-2" : ""
              }`}
            >
              <Label htmlFor={id} className="label-mono flex items-center gap-2">
                {f.label}
                {f.i18n ? (
                  <span className="border border-border px-1 py-px text-[9px] text-muted-foreground">
                    {lang.label}
                  </span>
                ) : (
                  <span className="border border-border px-1 py-px text-[9px] text-muted-foreground">
                    Igual en todos los idiomas
                  </span>
                )}
              </Label>
              {f.key === "photo_url" ? (
                <ImageField
                  id={id}
                  folder="studio"
                  value={read(f.key)}
                  onChange={(url) => write(f.key, url)}
                />
              ) : f.multiline ? (
                <Textarea
                  id={id}
                  rows={3}
                  value={read(f.key)}
                  onChange={(e) => write(f.key, e.target.value)}
                />
              ) : (
                <Input id={id} value={read(f.key)} onChange={(e) => write(f.key, e.target.value)} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
