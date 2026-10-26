import { Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGS, LANG_META, useTranslation } from "@/i18n";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang, tr } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        // The accessible name has to contain the visible text, or someone
        // using voice control who says "click ES" gets nothing — the button
        // showed "ES" but answered only to "Idioma".
        aria-label={`${tr("nav.language")}: ${lang.toUpperCase()}`}
        className={`flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-signal/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/60 ${className}`}
      >
        <Globe className="size-3.5" />
        {lang.toUpperCase()}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {LANGS.map((code) => (
          <DropdownMenuItem
            key={code}
            onSelect={() => setLang(code)}
            className="flex items-center justify-between gap-3 font-mono text-xs"
          >
            <span className="flex items-center gap-2">
              <span className="text-signal">{code.toUpperCase()}</span>
              <span className="font-sans text-sm text-foreground">{LANG_META[code].native}</span>
            </span>
            {lang === code && <Check className="size-3.5 text-signal" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
