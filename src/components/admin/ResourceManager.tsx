import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Plus, Trash2, Save, Loader2, ImagePlus, Languages } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadSiteImage } from "@/lib/cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type FieldKind = "text" | "textarea" | "number" | "list" | "boolean" | "image";
export type Field = {
  name: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  /**
   * The field has a column per language (`name`, `name_es`, `name_pt`, …).
   * Shown one language at a time instead of as thirty-odd inputs in a wall.
   */
  i18n?: boolean;
};

type Row = Record<string, unknown> & { id: string; order: number };

/**
 * Languages the site serves, and therefore the ones the admin must be able to
 * write. English is the base column; the rest carry a suffix.
 *
 * The admin only ever offered EN and ES, while cms.ts already looked for
 * `_pt`, `_fr`, `_de`, `_it` and `_ar`. The result was silent: a visitor in
 * German saw German chrome around English projects, pricing and FAQ, with
 * nothing in the panel to fix it.
 */
const LANGS = [
  { code: "en", label: "EN", suffix: "" },
  { code: "es", label: "ES", suffix: "_es" },
  { code: "pt", label: "PT", suffix: "_pt" },
  { code: "fr", label: "FR", suffix: "_fr" },
  { code: "de", label: "DE", suffix: "_de" },
  { code: "it", label: "IT", suffix: "_it" },
  { code: "ar", label: "AR", suffix: "_ar" },
] as const;

export function ResourceManager({
  table,
  title,
  description,
  fields,
  defaults,
  titleField,
}: {
  table: string;
  title: string;
  description: string;
  fields: Field[];
  defaults: Record<string, unknown>;
  titleField: string;
}) {
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, Record<string, unknown>>>({});
  const [rows, setRows] = useState<Row[]>([]);
  const [lang, setLang] = useState<(typeof LANGS)[number]>(LANGS[0]);
  const dragIndex = useRef<number | null>(null);
  const translatable = fields.some((f) => f.i18n);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", table],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table as never)
        .select("*")
        .order("order");
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  useEffect(() => {
    if (data) setRows(data);
  }, [data]);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin", table] });
    void qc.invalidateQueries({ queryKey: ["cms"] });
  };

  const createRow = useMutation({
    mutationFn: async () => {
      const order = (rows.at(-1)?.order ?? 0) + 1;
      const { error } = await supabase.from(table as never).insert({ ...defaults, order } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Creado");
      invalidate();
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  const saveRow = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { error } = await supabase
        .from(table as never)
        .update(values as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success("Guardado");
      setDrafts((d) => {
        const next = { ...d };
        delete next[vars.id];
        return next;
      });
      invalidate();
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  const deleteRow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(table as never)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Eliminado");
      invalidate();
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  const persistOrder = useMutation({
    mutationFn: async (ordered: Row[]) => {
      for (const [i, row] of ordered.entries()) {
        const { error } = await supabase
          .from(table as never)
          .update({ order: i + 1 } as never)
          .eq("id", row.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Orden guardado");
      invalidate();
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  const valueOf = (row: Row, name: string) => drafts[row.id]?.[name] ?? row[name];
  const setValue = (row: Row, name: string, value: unknown) =>
    setDrafts((d) => ({ ...d, [row.id]: { ...(d[row.id] ?? {}), [name]: value } }));

  function onDrop(target: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === target) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(target, 0, moved);
    setRows(next);
    persistOrder.mutate(next);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button
          onClick={() => createRow.mutate()}
          disabled={createRow.isPending}
          className="font-mono text-xs uppercase tracking-widest"
        >
          <Plus className="mr-1 size-4" /> Añadir
        </Button>
      </div>

      {translatable && (
        <div className="mt-6 flex flex-wrap items-center gap-2 border-y border-border py-3">
          <Languages className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="label-mono me-2">Idioma</span>
          {LANGS.map((l) => (
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
      )}

      {isLoading ? (
        <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Cargando...
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Todavía no hay elementos. Pulsa “Añadir” para crear el primero.
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Arrastra desde el asa para reordenar
          </p>
          {rows.map((row, index) => {
            const dirty = Boolean(drafts[row.id]);
            return (
              <div
                key={row.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(index)}
                className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-signal/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      draggable
                      onDragStart={() => (dragIndex.current = index)}
                      aria-label="Reordenar"
                      className="mt-0.5 cursor-grab rounded-md p-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground active:cursor-grabbing"
                    >
                      <GripVertical className="size-4" />
                    </button>
                    <div>
                      <p className="font-mono text-[11px] text-signal">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <p className="font-display text-base font-semibold">
                        {String(valueOf(row, titleField) ?? "Sin título")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={dirty ? "default" : "outline"}
                      disabled={!dirty || saveRow.isPending}
                      onClick={() => saveRow.mutate({ id: row.id, values: drafts[row.id] ?? {} })}
                      className="font-mono text-xs uppercase"
                    >
                      <Save className="mr-1 size-3.5" /> Guardar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar este elemento?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer y el elemento desaparecerá del sitio.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteRow.mutate(row.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {fields.map((f) => {
                    // A translatable field edits the column of the language
                    // currently selected above; everything else is shared.
                    const name = f.i18n ? `${f.name}${lang.suffix}` : f.name;
                    const raw = valueOf(row, name);
                    const id = `${row.id}-${name}`;
                    const wide = f.kind === "textarea" || f.kind === "list" || f.kind === "image";
                    return (
                      <div key={name} className={`space-y-2 ${wide ? "md:col-span-2" : ""}`}>
                        <Label htmlFor={id} className="label-mono flex items-center gap-2">
                          {f.label}
                          {f.i18n && (
                            <span className="border border-border px-1 py-px text-[9px] text-muted-foreground">
                              {lang.label}
                            </span>
                          )}
                        </Label>
                        {f.kind === "textarea" ? (
                          <Textarea
                            id={id}
                            rows={3}
                            value={String(raw ?? "")}
                            placeholder={f.placeholder}
                            onChange={(e) => setValue(row, name, e.target.value)}
                          />
                        ) : f.kind === "list" ? (
                          <Textarea
                            id={id}
                            rows={3}
                            value={
                              Array.isArray(raw) ? (raw as string[]).join("\n") : String(raw ?? "")
                            }
                            placeholder="Una línea por elemento"
                            onChange={(e) =>
                              setValue(
                                row,
                                name,
                                e.target.value
                                  .split("\n")
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              )
                            }
                          />
                        ) : f.kind === "boolean" ? (
                          <div className="flex h-10 items-center">
                            <Switch
                              id={id}
                              checked={Boolean(raw)}
                              onCheckedChange={(v) => setValue(row, name, v)}
                            />
                          </div>
                        ) : f.kind === "image" ? (
                          <ImageField
                            id={id}
                            folder={table}
                            value={String(raw ?? "")}
                            onChange={(url) => setValue(row, name, url)}
                          />
                        ) : (
                          <Input
                            id={id}
                            type={f.kind === "number" ? "number" : "text"}
                            value={String(raw ?? "")}
                            placeholder={f.placeholder}
                            onChange={(e) =>
                              setValue(
                                row,
                                name,
                                f.kind === "number" ? Number(e.target.value) : e.target.value,
                              )
                            }
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ImageField({
  id,
  folder,
  value,
  onChange,
}: {
  id: string;
  folder: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadSiteImage(file, folder);
      onChange(url);
      toast.success("Imagen subida — recuerda guardar");
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : "no se pudo subir"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {value ? (
        <img
          src={value}
          alt="Vista previa"
          loading="lazy"
          className="size-20 rounded-xl border border-border object-cover"
        />
      ) : (
        <div className="flex size-20 items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground">
          <ImagePlus className="size-5" />
        </div>
      )}
      <div className="flex-1 space-y-2">
        <Input
          id={id}
          value={value}
          placeholder="URL de la imagen"
          onChange={(e) => onChange(e.target.value)}
        />
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground">
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ImagePlus className="size-3.5" />
          )}
          Subir imagen
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </label>
      </div>
    </div>
  );
}
