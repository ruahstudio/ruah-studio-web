import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/i18n";
import type { ExtraKey } from "@/i18n/extra";

/**
 * Verifiable track record: real roles, real dates, real institutions.
 *
 * This is the section that separates a studio from an anonymous freelancer.
 * Nothing here is invented — every entry maps to something on the founder's
 * LinkedIn and can be checked. Stated as fact, without embellishment.
 */

/**
 * The entries carry translation KEYS, not finished text.
 *
 * Roles, locations, achievements and skill tags were written here as English
 * sentences, so John's whole CV — the section that makes a studio credible —
 * stayed in English for a visitor reading in Spanish, Portuguese, French,
 * German, Italian or Arabic.
 *
 * Dates, institution names and the studio's own name stay literal: they are
 * the same in every language, and translating an institution's name would
 * make it unverifiable, which is the one thing this section cannot afford.
 */
type Entry = {
  /** Literal: dates read the same everywhere. */
  period: string;
  /** Literal: the institution, as it is actually called. */
  org: string;
  roleKey: ExtraKey;
  locationKey: ExtraKey;
  pointKeys: ExtraKey[];
  tagKeys: ExtraKey[];
};

const EXPERIENCE: Entry[] = [
  {
    period: "2026 —",
    org: "Ruah Studio",
    roleKey: "cv.exp1.role",
    locationKey: "cv.exp1.loc",
    pointKeys: ["cv.exp1.p1", "cv.exp1.p2"],
    tagKeys: ["cv.exp1.g1", "cv.exp1.g2", "cv.exp1.g3", "cv.exp1.g4"],
  },
  {
    period: "2025 — 2026",
    org: "VitalCare · Universidad de Oriente",
    roleKey: "cv.exp2.role",
    locationKey: "cv.exp2.loc",
    pointKeys: ["cv.exp2.p1", "cv.exp2.p2", "cv.exp2.p3"],
    tagKeys: ["cv.exp2.g1", "cv.exp2.g2", "cv.exp2.g3", "cv.exp2.g4"],
  },
];

const EDUCATION: Entry[] = [
  {
    period: "2023 — 2028",
    org: "Universidad de Oriente",
    roleKey: "cv.edu1.role",
    locationKey: "cv.edu1.loc",
    pointKeys: ["cv.edu1.p1", "cv.edu1.p2"],
    tagKeys: ["cv.edu1.g1", "cv.edu1.g2", "cv.edu1.g3", "cv.edu1.g4"],
  },
];

function Timeline({ entries, label }: { entries: Entry[]; label: string }) {
  const reduced = useReducedMotion();
  const { tr } = useTranslation();
  return (
    <div>
      <p className="label-mono">{label}</p>
      <div className="mt-6">
        {entries.map((e, i) => (
          <motion.article
            key={e.roleKey}
            initial={reduced ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="grid gap-3 border-t border-border py-7 last:border-b md:grid-cols-12 md:gap-8"
          >
            <p className="label-mono numeric md:col-span-3" dir="ltr">
              {e.period}
            </p>

            <div className="md:col-span-9">
              <h3 className="font-display text-lg font-bold tracking-tight">{tr(e.roleKey)}</h3>
              <p className="mt-0.5 font-mono text-xs text-signal">{e.org}</p>
              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                {tr(e.locationKey)}
              </p>

              <ul className="mt-4 space-y-2">
                {e.pointKeys.map((key) => (
                  <li
                    key={key}
                    className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
                  >
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-signal/60" aria-hidden />
                    <span>{tr(key)}</span>
                  </li>
                ))}
              </ul>

              <ul className="mt-4 flex flex-wrap gap-x-1.5 gap-y-2">
                {e.tagKeys.map((key, j) => (
                  <li key={key} className="font-mono text-[11px] text-foreground/70">
                    {tr(key)}
                    {j < e.tagKeys.length - 1 && (
                      <span className="ms-1.5 text-signal/40" aria-hidden>
                        /
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}

export function TrackRecord() {
  const { tr } = useTranslation();

  return (
    <section id="track-record" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-5 sm:px-6" style={{ paddingBlock: "var(--section-y)" }}>
        <div className="max-w-[34ch]">
          <p className="label-mono">{tr("record.eyebrow")}</p>
          <h2 className="display-lg mt-4">{tr("record.title")}</h2>
        </div>

        <div className="mt-10 grid gap-12 md:mt-14 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-8">
            <Timeline entries={EXPERIENCE} label={tr("record.experience")} />
          </div>
          <div className="md:col-span-4">
            <Timeline entries={EDUCATION} label={tr("record.education")} />
          </div>
        </div>
      </div>
    </section>
  );
}
