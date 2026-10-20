import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { STUDIO_DEFAULTS, STUDIO_FIELDS } from "@/lib/cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageField } from "@/components/admin/ResourceManager";

export function TextsEditor() {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [valuesEs, setValuesEs] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "studio_content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("studio_content").select("key, value, value_es");
      if (error) throw error;
      const map: Record<string, string> = { ...STUDIO_DEFAULTS };
      const mapEs: Record<string, string> = {};
      for (const row of data ?? []) {
        map[row.key] = row.value;
        mapEs[row.key] = row.value_es ?? "";
      }
      return { map, mapEs };
    },
  });

  useEffect(() => {
    if (data) {
      setValues(data.map);
      setValuesEs(data.mapEs);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const rows = STUDIO_FIELDS.map((f) => ({
        key: f.key,
        value: values[f.key] ?? "",
        value_es: valuesEs[f.key] ?? "",
      }));
      const { error } = await supabase.from("studio_content").upsert(rows, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Guardado");
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
          disabled={save.isPending}
          className="font-mono text-xs uppercase tracking-widest"
        >
          <Save className="mr-1 size-4" /> Guardar cambios
        </Button>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {STUDIO_FIELDS.map((f) => (
          <div
            key={f.key}
            className={`space-y-2 rounded-2xl border border-border bg-card p-5 ${
              f.multiline || f.key === "photo_url" ? "md:col-span-2" : ""
            }`}
          >
            <Label htmlFor={f.key} className="label-mono">
              {f.label} {f.key === "photo_url" ? "" : "(EN)"}
            </Label>
            {f.key === "photo_url" ? (
              <ImageField
                id={f.key}
                folder="studio"
                value={values[f.key] ?? ""}
                onChange={(url) => setValues((v) => ({ ...v, [f.key]: url }))}
              />
            ) : f.multiline ? (
              <Textarea
                id={f.key}
                rows={3}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            ) : (
              <Input
                id={f.key}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            )}
            {f.key !== "photo_url" && (
              <>
                <Label htmlFor={`${f.key}_es`} className="label-mono">
                  {f.label} (ES)
                </Label>
                {f.multiline ? (
                  <Textarea
                    id={`${f.key}_es`}
                    rows={3}
                    value={valuesEs[f.key] ?? ""}
                    onChange={(e) => setValuesEs((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                ) : (
                  <Input
                    id={`${f.key}_es`}
                    value={valuesEs[f.key] ?? ""}
                    onChange={(e) => setValuesEs((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
