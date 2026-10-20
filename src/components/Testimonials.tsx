import { Quote } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { useTestimonials } from "@/lib/cms";
import { useTranslation } from "@/i18n";

export function Testimonials() {
  const { data } = useTestimonials();
  const { tr } = useTranslation();
  const items = data ?? [];
  if (items.length === 0) return null;

  const initials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <section id="testimonials" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <p className="label-mono">{tr("testimonials.eyebrow")}</p>
          <h2 className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight md:text-5xl">
            {tr("testimonials.title")}
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={item.id} delay={i * 80}>
              <article className="flex h-full flex-col bg-surface p-8">
                <Quote className="size-6 text-signal" strokeWidth={1.6} />
                <p className="mt-5 flex-1 text-sm leading-relaxed text-foreground/90">
                  “{item.text}”
                </p>
                <footer className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                  {item.avatar_url ? (
                    <img
                      src={item.avatar_url}
                      alt={item.name}
                      loading="lazy"
                      className="size-10 rounded-full border border-signal/40 object-cover"
                    />
                  ) : (
                    <span className="flex size-10 items-center justify-center rounded-full border border-signal/40 bg-surface-2 font-mono text-xs text-signal">
                      {initials(item.name)}
                    </span>
                  )}
                  <span>
                    <p className="font-display text-sm font-semibold">{item.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{item.business}</p>
                  </span>
                </footer>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
