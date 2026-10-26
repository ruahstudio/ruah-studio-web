import { useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslation, type AnyKey } from "@/i18n";
import { normalizeInstagram, validateEmail, validateName, validatePhone } from "@/lib/contact";
import type { Contact } from "@/lib/leads";

/**
 * Name, WhatsApp, email and Instagram — the same fields and the same rules in
 * the chat and in the form.
 *
 * Feedback is live but quiet: a field only shows an error after it has been
 * left (or on submit), never while someone is still typing their number. When
 * a value is valid the field says what it understood — "+58 414 123 4567 ·
 * VE" — so a wrong country or a typo is caught by the visitor, not by John.
 */

export type ContactValues = { name: string; phone: string; email: string; instagram: string };
export const EMPTY_CONTACT: ContactValues = { name: "", phone: "", email: "", instagram: "" };

type Errors = Partial<Record<keyof ContactValues, string>>;

/** Validate everything; returns the cleaned contact or the errors to show. */
export function checkContact(
  v: ContactValues,
  T: (k: AnyKey) => string,
): { contact: Contact | null; errors: Errors } {
  const errors: Errors = {};
  const name = validateName(v.name);
  if (!name) errors.name = T("form.errName");
  const phone = validatePhone(v.phone);
  if (!phone.ok)
    errors.phone = T(phone.error === "not_mobile" ? "form.errPhoneLandline" : "form.errPhone");
  const email = validateEmail(v.email);
  if (!email.ok)
    errors.email = T(email.error === "disposable" ? "form.errEmailDisposable" : "form.errEmail");
  const ig = normalizeInstagram(v.instagram);
  if (!ig.ok) errors.instagram = T("form.errInstagram");
  if (Object.keys(errors).length || !name || !phone.ok || !email.ok || !ig.ok) {
    return { contact: null, errors };
  }
  return {
    contact: { name, phone: phone.digits, email: email.email, instagram: ig.handle },
    errors,
  };
}

export function ContactFields({
  values,
  onChange,
  errors,
  idPrefix = "",
  showName = true,
  compact = false,
}: {
  values: ContactValues;
  onChange: (v: ContactValues) => void;
  errors: Errors;
  idPrefix?: string;
  showName?: boolean;
  compact?: boolean;
}) {
  const { tr } = useTranslation();
  const [touched, setTouched] = useState<Partial<Record<keyof ContactValues, boolean>>>({});
  const set = (k: keyof ContactValues) => (x: string) => onChange({ ...values, [k]: x });
  const blur = (k: keyof ContactValues) => () => setTouched((t) => ({ ...t, [k]: true }));

  const phone = validatePhone(values.phone);
  const email = validateEmail(values.email);
  const ig = normalizeInstagram(values.instagram);

  // Live errors after the field was left; submit errors always.
  const live = (k: keyof ContactValues, bad: boolean, msg: string) =>
    errors[k] ?? (touched[k] && bad ? msg : undefined);

  const phoneErr = live(
    "phone",
    !phone.ok,
    tr(!phone.ok && phone.error === "not_mobile" ? "form.errPhoneLandline" : "form.errPhone"),
  );
  const emailErr = live(
    "email",
    !email.ok,
    tr(!email.ok && email.error === "disposable" ? "form.errEmailDisposable" : "form.errEmail"),
  );
  const igErr = live("instagram", !ig.ok, tr("form.errInstagram"));
  const nameErr = live("name", !validateName(values.name), tr("form.errName"));

  return (
    <div className={`grid ${compact ? "gap-3" : "gap-5"}`}>
      {showName && (
        <Row
          id={`${idPrefix}name`}
          label={tr("form.name")}
          required
          value={values.name}
          onChange={set("name")}
          onBlur={blur("name")}
          autoComplete="name"
          placeholder={tr("form.namePlaceholder")}
          error={nameErr}
          compact={compact}
        />
      )}
      <Row
        id={`${idPrefix}phone`}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        label={tr("form.phone")}
        required
        value={values.phone}
        onChange={set("phone")}
        onBlur={blur("phone")}
        placeholder="+58 414 000 0000"
        error={phoneErr}
        ok={phone.ok ? `${phone.pretty}${phone.country ? ` · ${phone.country}` : ""}` : undefined}
        compact={compact}
      />
      <Row
        id={`${idPrefix}email`}
        type="email"
        inputMode="email"
        autoComplete="email"
        label={tr("form.email")}
        required
        value={values.email}
        onChange={set("email")}
        onBlur={blur("email")}
        placeholder={tr("form.emailPlaceholder")}
        error={emailErr}
        compact={compact}
        extra={
          email.suggestion ? (
            <button
              type="button"
              data-testid={`${idPrefix}email-suggest`}
              onClick={() => onChange({ ...values, email: email.suggestion! })}
              className="text-start font-mono text-xs text-signal underline-offset-2 hover:underline"
            >
              {tr("form.emailSuggest", { email: email.suggestion })}
            </button>
          ) : null
        }
      />
      <Row
        id={`${idPrefix}instagram`}
        autoComplete="off"
        label={`${tr("form.instagram")} (${tr("form.optional")})`}
        value={values.instagram}
        onChange={set("instagram")}
        onBlur={blur("instagram")}
        placeholder={tr("form.instagramPlaceholder")}
        error={igErr}
        ok={ig.ok && ig.handle ? `instagram.com/${ig.handle}` : undefined}
        compact={compact}
      />
    </div>
  );
}

function Row({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  ok,
  required,
  type = "text",
  inputMode,
  autoComplete,
  extra,
  compact,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder?: string;
  error?: string | undefined;
  ok?: string | undefined;
  required?: boolean;
  type?: "text" | "tel" | "email";
  inputMode?: "text" | "tel" | "email";
  autoComplete?: string;
  extra?: React.ReactNode;
  compact?: boolean | undefined;
}) {
  const describedBy = error ? `${id}-error` : ok ? `${id}-ok` : undefined;
  return (
    <div className="grid gap-1.5">
      <label className={`label-mono ${compact ? "text-[10px]" : ""}`} htmlFor={id}>
        {label} {required && "*"}
      </label>
      <Input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={120}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={compact ? "h-9 text-sm" : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="font-mono text-xs text-destructive">
          {error}
        </p>
      ) : ok ? (
        <p id={`${id}-ok`} className="flex items-center gap-1 font-mono text-xs text-signal">
          <Check className="size-3" aria-hidden /> {ok}
        </p>
      ) : null}
      {extra}
    </div>
  );
}
