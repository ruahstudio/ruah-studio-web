import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceso al panel — Ruah Studio" },
      { name: "description", content: "Acceso privado al panel de administración del estudio." },
      { property: "og:title", content: "Acceso al panel — Ruah Studio" },
      {
        property: "og:description",
        content: "Acceso privado al panel de administración del estudio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    void supabase.rpc("admin_exists").then(({ data }) => setNeedsSetup(data === false));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (needsSetup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Cuenta de administrador creada");
          navigate({ to: "/admin", replace: true });
        } else {
          toast.success("Revisa tu correo para confirmar la cuenta");
        }
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Sesión iniciada");
      navigate({ to: "/admin", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo completar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8">
        <span className="inline-block size-2 rounded-full bg-signal" />
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">Panel del estudio</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {needsSetup
            ? "Crea la cuenta de administrador del estudio. Solo se permite una."
            : "Acceso privado del administrador. Entra para editar proyectos, precios y textos."}
        </p>
        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="label-mono">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="label-mono">
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="w-full font-mono text-xs uppercase tracking-widest"
          >
            {busy ? "..." : needsSetup ? "Crear cuenta de administrador" : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
