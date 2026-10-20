import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/i18n";

/**
 * Verifiable track record: real roles, real dates, real institutions.
 *
 * This is the section that separates a studio from an anonymous freelancer.
 * Nothing here is invented — every entry maps to something on the founder's
 * LinkedIn and can be checked. Stated as fact, without embellishment.
 */

type Entry = {
  period: string;
  role: string;
  org: string;
  location: string;
  points: string[];
  tags: string[];
};

const EXPERIENCE: Entry[] = [
  {
    period: "2026 —",
    role: "Founder & Full-Stack Developer",
    org: "Ruah Studio",
    location: "Nueva Esparta, Venezuela · Remote",
    points: [
      "Full product lifecycle: problem, architecture, frontend, backend, data, integrations, AI workflows, security, deployment and documentation.",
      "Web applications, AI-powered workflows, business process automation, dashboards and internal systems.",
    ],
    tags: ["Full-stack", "Applied AI", "Automation", "System architecture"],
  },
  {
    period: "2025 — 2026",
    role: "Multidisciplinary Project Leader",
    org: "VitalCare · Universidad de Oriente",
    location: "Nueva Esparta, Venezuela · Hybrid",
    points: [
      "Led a multidisciplinary team building a low-cost autonomous patient monitoring system for outpatient clinics.",
      "Real-time monitoring of oxygen saturation, heart rate, respiratory rate, temperature and ECG signals, with wireless connectivity, early-warning alerts and energy backup.",
      "Coordinated research, hardware and software integration, and the technical proposal end to end.",
    ],
    tags: ["Embedded systems", "IoT", "Medical sensing", "Team leadership"],
  },
];

const EDUCATION: Entry[] = [
  {
    period: "2023 — 2028",
    role: "B.Sc. Computer Science",
    org: "Universidad de Oriente",
    location: "Grade 8.44 / 10",
    points: [
      "Section Leader every semester. Robotics Group project lead. Community service.",
      "Coursework in C, C++ and C#, object-oriented programming, algorithms, numerical methods and linear programming.",
    ],
    tags: ["Algorithms", "Mathematics", "Databases", "Computer systems"],
  },
];

function Timeline({ entries, label }: { entries: Entry[]; label: string }) {
  const reduced = useReducedMotion();
  return (
    <div>
      <p className="label-mono">{label}</p>
      <div className="mt-6">
        {entries.map((e, i) => (
          <motion.article
            key={e.role}
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
              <h3 className="font-display text-lg font-bold tracking-tight">{e.role}</h3>
              <p className="mt-0.5 font-mono text-xs text-signal">{e.org}</p>
              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{e.location}</p>

              <ul className="mt-4 space-y-2">
                {e.points.map((pt) => (
                  <li
                    key={pt}
                    className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
                  >
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-signal/60" aria-hidden />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>

              <ul className="mt-4 flex flex-wrap gap-x-1.5 gap-y-2">
                {e.tags.map((t, j) => (
                  <li key={t} className="font-mono text-[11px] text-foreground/70">
                    {t}
                    {j < e.tags.length - 1 && (
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
