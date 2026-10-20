import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LogOut,
  ExternalLink,
  ShieldAlert,
  FolderKanban,
  HelpCircle,
  Tags,
  ListChecks,
  Type,
  Quote,
  Inbox,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { TextsEditor } from "@/components/admin/TextsEditor";
import { Crm } from "@/components/admin/Crm";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Panel del estudio — Ruah Studio" },
      {
        name: "description",
        content: "Panel privado para actualizar proyectos, precios y textos.",
      },
      { property: "og:title", content: "Panel del estudio — Ruah Studio" },
      {
        property: "og:description",
        content: "Panel privado para actualizar proyectos, precios y textos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const NAV = [
  { id: "projects", label: "Proyectos", icon: FolderKanban },
  { id: "faqs", label: "FAQ", icon: HelpCircle },
  { id: "pricing", label: "Precios", icon: Tags },
  { id: "we_build", label: "We build", icon: ListChecks },
  { id: "texts", label: "Textos", icon: Type },
  { id: "testimonials", label: "Testimonios", icon: Quote },
  { id: "leads", label: "CRM", icon: Inbox },
] as const;

type SectionId = (typeof NAV)[number]["id"];

function AdminPage() {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [section, setSection] = useState<SectionId>("projects");

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-signal" />
            <span className="font-display text-sm font-bold tracking-tight">
              RUAH STUDIO · PANEL
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="font-mono text-xs uppercase">
              <Link to="/">
                Ver sitio <ExternalLink className="ml-1 size-3.5" />
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={signOut}
              className="font-mono text-xs uppercase"
            >
              <LogOut className="mr-1 size-3.5" /> Salir
            </Button>
          </div>
        </div>
      </header>

      {loading ? (
        <p className="mx-auto max-w-7xl px-6 py-16 text-sm text-muted-foreground">
          Verificando acceso...
        </p>
      ) : !isAdmin ? (
        <div className="mx-auto max-w-lg px-6 py-24">
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <ShieldAlert className="mx-auto size-8 text-signal" />
            <h1 className="mt-4 font-display text-2xl font-bold">Sin permisos de administrador</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              La cuenta {user?.email} no tiene acceso al panel.
            </p>
          </div>
        </div>
      ) : (
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 md:grid-cols-[220px_1fr]">
          <nav className="h-fit rounded-2xl border border-border bg-card p-3 md:sticky md:top-24">
            <p className="label-mono px-3 py-2">Contenido</p>
            <ul className="flex flex-wrap gap-1 md:block">
              {NAV.map((n) => {
                const active = section === n.id;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => setSection(n.id)}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                        active
                          ? "bg-signal/15 font-medium text-foreground"
                          : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                      }`}
                    >
                      <n.icon className={`size-4 ${active ? "text-signal" : ""}`} />
                      {n.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <main className="min-w-0">
            {section === "projects" && (
              <ResourceManager
                table="projects"
                title="Proyectos"
                description="Casos que se muestran en la sección Selected work."
                titleField="title"
                defaults={{ code: "05", title: "Nuevo proyecto", subtitle: "", description: "" }}
                fields={[
                  { name: "code", label: "Código (01, 02...)", kind: "text" },
                  { name: "title", label: "Título (EN)", kind: "text" },
                  { name: "title_es", label: "Título (ES)", kind: "text" },
                  { name: "subtitle", label: "Subtítulo (EN)", kind: "text" },
                  { name: "subtitle_es", label: "Subtítulo (ES)", kind: "text" },
                  { name: "link", label: "Enlace", kind: "text", placeholder: "https://" },
                  { name: "description", label: "Descripción (EN)", kind: "textarea" },
                  { name: "description_es", label: "Descripción (ES)", kind: "textarea" },
                  { name: "stack", label: "Stack (uno por línea)", kind: "list" },
                  { name: "prefill", label: "Texto precargado en el formulario", kind: "textarea" },
                  { name: "image_url", label: "Screenshot del proyecto", kind: "image" },
                ]}
              />
            )}
            {section === "faqs" && (
              <ResourceManager
                table="faqs"
                title="Preguntas frecuentes"
                description="Acordeón de FAQ del sitio."
                titleField="question"
                defaults={{ question: "Nueva pregunta", answer: "Respuesta..." }}
                fields={[
                  { name: "question", label: "Pregunta (EN)", kind: "text" },
                  { name: "question_es", label: "Pregunta (ES)", kind: "text" },
                  { name: "answer", label: "Respuesta (EN)", kind: "textarea" },
                  { name: "answer_es", label: "Respuesta (ES)", kind: "textarea" },
                ]}
              />
            )}
            {section === "pricing" && (
              <ResourceManager
                table="pricing"
                title="Precios base"
                description="Tarjetas de precios del sitio."
                titleField="service"
                defaults={{ service: "Nuevo servicio", price_from: "desde $100", description: "" }}
                fields={[
                  { name: "service", label: "Servicio (EN)", kind: "text" },
                  { name: "service_es", label: "Servicio (ES)", kind: "text" },
                  {
                    name: "price_from",
                    label: "Precio desde",
                    kind: "text",
                    placeholder: "desde $100",
                  },
                  { name: "description", label: "Descripción (EN)", kind: "textarea" },
                  { name: "description_es", label: "Descripción (ES)", kind: "textarea" },
                  { name: "bullets", label: "Incluye (uno por línea)", kind: "list" },
                ]}
              />
            )}
            {section === "we_build" && (
              <ResourceManager
                table="we_build"
                title="We build"
                description="Lista de lo que construye el estudio."
                titleField="item"
                defaults={{ item: "Nuevo servicio" }}
                fields={[
                  { name: "item", label: "Ítem (EN)", kind: "text" },
                  { name: "item_es", label: "Ítem (ES)", kind: "text" },
                ]}
              />
            )}
            {section === "texts" && <TextsEditor />}
            {section === "testimonials" && (
              <ResourceManager
                table="testimonials"
                title="Testimonios"
                description="Solo los testimonios publicados aparecen en el sitio."
                titleField="name"
                defaults={{ name: "Nuevo cliente", business: "", text: "", published: false }}
                fields={[
                  { name: "name", label: "Nombre", kind: "text" },
                  { name: "business", label: "Negocio", kind: "text" },
                  { name: "published", label: "Publicado", kind: "boolean" },
                  { name: "text", label: "Testimonio (EN)", kind: "textarea" },
                  { name: "text_es", label: "Testimonio (ES)", kind: "textarea" },
                  { name: "avatar_url", label: "Avatar", kind: "image" },
                ]}
              />
            )}
            {section === "leads" && <Crm />}
          </main>
        </div>
      )}
    </div>
  );
}
