import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import signature from "@/assets/signature.png";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SITE } from "@/lib/content";
import { useTranslation } from "@/i18n";

/**
 * Shared site footer.
 *
 * Extracted from the landing route because /about had no footer at all — with
 * the header's section links also dead on that page, there was genuinely no
 * way back to the landing from /about except the browser's back button.
 */
export function SiteFooter({ siteName }: { siteName: string }) {
  const { tr } = useTranslation();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-5 py-10 sm:px-6">
        <div>
          {/*
           * signature-ink, not `invert`. The asset is black ink: inverting it
           * unconditionally made it white-on-white in the light theme, which
           * is the same bug that was fixed in the About portrait and then
           * quietly survived here.
           */}
          <img
            src={signature}
            alt={`${tr("about.signatureAlt")} ${SITE.founder}`}
            width={480}
            height={240}
            loading="lazy"
            className="signature-ink h-14 w-auto"
          />
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            © {new Date().getFullYear()} {siteName} — {tr("site.tagline")}
          </p>
        </div>
        <div className="flex items-center gap-5">
          <p className="hidden font-mono text-xs text-muted-foreground sm:block">
            {tr("footer.claim")}
          </p>
          <LanguageSwitcher />
          <Link
            to="/auth"
            aria-label={tr("footer.adminAria")}
            className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Lock className="size-3.5" /> {tr("footer.panel")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
