import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { useProjects } from "@/lib/cms";
import { projectSlug } from "@/lib/slug";
import { useTranslation } from "@/i18n";

export const Route = createFileRoute("/work/$slug")({
  component: CaseStudy,
});

/** Sets `robots: noindex` while it is mounted, and restores it on the way out. */
function NoIndex() {
  useEffect(() => {
    const tag = document.querySelector('meta[name="robots"]');
    const previous = tag?.getAttribute("content") ?? null;
    if (tag) tag.setAttribute("content", "noindex, follow");
    return () => {
      if (tag && previous !== null) tag.setAttribute("content", previous);
    };
  }, []);
  return null;
}

function CaseStudy() {
  const { slug } = Route.useParams();
  const { tr, dir } = useTranslation();
  const { data: projects, isLoading } = useProjects();

  const list = projects ?? [];
  const index = list.findIndex((p) => projectSlug(p) === slug);
  const project = index >= 0 ? list[index] : undefined;
  const prev = index > 0 ? list[index - 1] : undefined;
  const next = index >= 0 && index < list.length - 1 ? list[index + 1] : undefined;

  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;
  const Fwd = dir === "rtl" ? ArrowLeft : ArrowRight;

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-32 sm:px-6">
        <div className="h-4 w-32 animate-pulse rounded bg-surface-2" />
        <div className="mt-6 h-16 w-3/4 animate-pulse rounded bg-surface-2" />
      </main>
    );
  }

  if (!project) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-32 text-center sm:px-6">
        {/* Keep the miss out of the index.
         *
         * This route answered HTTP 200 for any slug, so Google was free to
         * index every wrong URL as a real page. A true 404 status needs the
         * projects to load on the server — which is also what would let a
         * case study be crawlable at all — so that comes with the portfolio
         * work. Until then, this at least stops the indexing. */}
        <NoIndex />
        <p className="label-mono">404</p>
        <h1 className="display-lg mt-4">{tr("work.title")}</h1>
        <Button asChild className="mt-8 font-mono text-xs uppercase tracking-widest">
          <Link to="/">
            <Back className="me-1 size-4" aria-hidden /> {tr("nav.work")}
          </Link>
        </Button>
      </main>
    );
  }

  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-25" />
        <div className="relative mx-auto max-w-5xl px-5 py-24 sm:px-6 md:py-32">
          <Link
            to="/"
            className="link-underline label-mono inline-flex items-center gap-2 hover:text-foreground"
          >
            <Back className="size-3.5" aria-hidden /> {tr("nav.work")}
          </Link>

          <p className="label-mono numeric mt-10 text-signal">{project.code}</p>
          <h1 className="display-lg mt-4 max-w-[18ch]">{project.title}</h1>
          <p className="lede mt-6">{project.subtitle}</p>

          <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden border-t border-border md:grid-cols-4">
            {[
              [tr("work.eyebrow"), project.code],
              ["Stack", `${project.stack.length}`],
              ["Status", project.link ? "Live" : "Prototype"],
              ["Studio", "Ruah"],
            ].map(([k, v]) => (
              <div key={k} className="border-b border-border py-5 pe-6">
                <dt className="label-mono">{k}</dt>
                <dd className="numeric mt-1 font-display text-lg font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* INTERFACE */}
      {project.image_url && (
        <section className="border-b border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
            <Reveal>
              <img
                src={project.image_url}
                alt={project.title}
                loading="lazy"
                className="w-full rounded-2xl border border-border object-cover"
              />
            </Reveal>
          </div>
        </section>
      )}

      {/* APPROACH */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-5xl gap-12 px-5 py-20 sm:px-6 md:grid-cols-12 md:py-28">
          <div className="md:col-span-4">
            <p className="label-mono">01 — Approach</p>
          </div>
          <div className="md:col-span-8">
            <p className="text-lg leading-relaxed">{project.description}</p>
          </div>
        </div>
      </section>

      {/* STACK */}
      <section className="border-b border-border bg-surface/40">
        <div className="mx-auto grid max-w-5xl gap-12 px-5 py-20 sm:px-6 md:grid-cols-12 md:py-28">
          <div className="md:col-span-4">
            <p className="label-mono">02 — Stack</p>
          </div>
          <div className="md:col-span-8">
            <ul className="flex flex-wrap gap-2">
              {project.stack.map((s) => (
                <li
                  key={s}
                  className="rounded-md border border-border bg-surface-2 px-3 py-1.5 font-mono text-xs text-muted-foreground"
                >
                  {s}
                </li>
              ))}
            </ul>
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline mt-8 inline-flex items-center gap-1.5 font-mono text-sm text-signal"
              >
                {tr("work.cta")}
                <ArrowUpRight
                  className={`size-4 ${dir === "rtl" ? "-scale-x-100" : ""}`}
                  aria-hidden
                />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-5 py-24 text-center sm:px-6">
          <h2 className="display-md mx-auto max-w-[20ch]">{tr("work.similar")}</h2>
          <Button asChild size="lg" className="mt-8 font-mono text-xs uppercase tracking-widest">
            <Link to="/" hash="contact">
              {tr("nav.start")}
            </Link>
          </Button>
        </div>
      </section>

      {/* PREV / NEXT */}
      <nav className="mx-auto flex max-w-5xl flex-col gap-px px-5 py-12 sm:px-6 md:flex-row">
        {prev && (
          <Link
            to="/work/$slug"
            params={{ slug: projectSlug(prev) }}
            className="group flex-1 border border-border p-8 transition-colors hover:border-signal/40"
          >
            <span className="label-mono flex items-center gap-2">
              <Back className="size-3.5" aria-hidden /> Previous
            </span>
            <span className="display-md mt-3 block transition-colors group-hover:text-signal">
              {prev.title}
            </span>
          </Link>
        )}
        {next && (
          <Link
            to="/work/$slug"
            params={{ slug: projectSlug(next) }}
            className="group flex-1 border border-border p-8 text-end transition-colors hover:border-signal/40"
          >
            <span className="label-mono flex items-center justify-end gap-2">
              Next <Fwd className="size-3.5" aria-hidden />
            </span>
            <span className="display-md mt-3 block transition-colors group-hover:text-signal">
              {next.title}
            </span>
          </Link>
        )}
      </nav>
    </main>
  );
}
