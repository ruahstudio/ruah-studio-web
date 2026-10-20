import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LeadNoteKind, LeadStatus } from "@/integrations/supabase/types";

/**
 * CRM data layer.
 *
 * Kept apart from cms.ts because the two answer different questions: cms.ts is
 * public site content that falls back to static copy when Supabase is empty,
 * while this is private operational data where an empty result means "no leads
 * yet", never "use the defaults".
 */

export type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  business: string;
  problem: string;
  chat_summary: string | null;
  brief: Partial<
    Record<"problem" | "business" | "outcome" | "current" | "timeline" | "budget", string>
  > | null;
  timeline: string;
  budget_fit: string | null;
  score: "hot" | "warm" | "cold" | null;
  chat_transcript: { role: string; content: string }[] | null;
  modules: string[];
  estimate_usd: number | null;
  weeks: number | null;
  goal: string;
  goals: string[];
  goal_other: string | null;
  quote_path: string | null;
  quote_url: string | null;
  budget: string;
  ref: string;
  lang: string;
  source: string;
  status: LeadStatus;
  value_usd: number | null;
  next_action_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Meeting = {
  id: string;
  lead_id: string;
  kind: string;
  title: string;
  held_at: string;
  source: string;
  transcript: string;
  analysis: unknown;
  author: string;
  analyzed_by: string | null;
  created_at: string;
};

export type LeadNote = {
  id: string;
  lead_id: string;
  body: string;
  kind: LeadNoteKind;
  author: string;
  created_at: string;
};

/** Pipeline order. The board renders stages in exactly this sequence. */
export const STAGES: LeadStatus[] = [
  "nuevo",
  "contactado",
  "diagnostico",
  "propuesta",
  "ganado",
  "perdido",
];

export const STAGE_LABEL: Record<LeadStatus, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  diagnostico: "Diagnóstico",
  propuesta: "Propuesta",
  ganado: "Ganado",
  perdido: "Perdido",
};

/** Stages where the deal is still alive — used for the pipeline total. */
export const OPEN_STAGES: LeadStatus[] = ["nuevo", "contactado", "diagnostico", "propuesta"];

export function useLeads() {
  return useQuery({
    queryKey: ["crm", "leads"],
    queryFn: async (): Promise<Lead[]> => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Lead[];
    },
  });
}

export function useLeadNotes(leadId: string | null) {
  return useQuery({
    queryKey: ["crm", "notes", leadId],
    enabled: Boolean(leadId),
    queryFn: async (): Promise<LeadNote[]> => {
      const { data, error } = await supabase
        .from("lead_notes")
        .select("*")
        .eq("lead_id", leadId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as LeadNote[];
    },
  });
}

/** Meetings whose transcript John uploaded, newest first. */
export function useMeetings(leadId: string | null) {
  return useQuery({
    queryKey: ["crm", "meetings", leadId],
    enabled: Boolean(leadId),
    queryFn: async (): Promise<Meeting[]> => {
      const { data, error } = await supabase
        .from("lead_meetings")
        .select("*")
        .eq("lead_id", leadId!)
        .order("held_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Meeting[];
    },
  });
}

export function useAddMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: {
      leadId: string;
      kind: string;
      title: string;
      source: string;
      transcript: string;
      analysis: unknown;
      analyzedBy: string;
    }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("lead_meetings").insert({
        lead_id: m.leadId,
        kind: m.kind,
        title: m.title.slice(0, 200),
        source: m.source.slice(0, 120),
        transcript: m.transcript,
        analysis: m.analysis as never,
        analyzed_by: m.analyzedBy,
        author: auth.user?.email ?? "",
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["crm", "meetings", vars.leadId] });
      void qc.invalidateQueries({ queryKey: ["crm", "notes", vars.leadId] });
      void qc.invalidateQueries({ queryKey: ["crm", "leads"] });
    },
  });
}

/**
 * A signed link to the quote the client received. The bucket is private and
 * only the admin can read it, so this link is made here, on demand, and lives
 * one hour — long enough to open it, not long enough to leak.
 */
export async function quoteLink(lead: Pick<Lead, "quote_path">): Promise<string | null> {
  if (!lead.quote_path) return null;
  const { data, error } = await supabase.storage
    .from("quotes")
    .createSignedUrl(lead.quote_path, 3600);
  if (error || !data?.signedUrl) {
    console.error("quote link failed", error);
    return null;
  }
  return data.signedUrl;
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Lead> }) => {
      const { error } = await supabase.from("leads").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["crm", "leads"] });
      // A stage change makes the database write a timeline entry, so the notes
      // for this lead are stale too.
      void qc.invalidateQueries({ queryKey: ["crm", "notes", vars.id] });
    },
  });
}

export function useAddNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, body }: { leadId: string; body: string }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("lead_notes").insert({
        lead_id: leadId,
        body: body.trim(),
        kind: "note",
        author: auth.user?.email ?? "",
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["crm", "notes", vars.leadId] });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["crm", "leads"] }),
  });
}

/** wa.me link, or null when there is no phone to dial. */
export function leadWhatsApp(lead: Lead, message?: string): string | null {
  const digits = (lead.phone ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const q = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${q}`;
}

export function leadMailto(lead: Lead, subject?: string): string | null {
  const email = (lead.email ?? "").trim();
  if (!email) return null;
  const q = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return `mailto:${email}${q}`;
}

/** Profile link, or null when the lead gave no handle (it's optional). */
export function leadInstagram(lead: Lead): string | null {
  const h = (lead.instagram ?? "").trim().replace(/^@/, "");
  return h ? `https://instagram.com/${encodeURIComponent(h)}` : null;
}

/** A lead older than this with no stage change is going cold. */
const STALE_DAYS = 7;

export function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export function isStale(lead: Lead): boolean {
  return OPEN_STAGES.includes(lead.status) && daysSince(lead.updated_at) >= STALE_DAYS;
}

/** Follow-up is due when the date set on the lead has passed. */
export function isDue(lead: Lead): boolean {
  if (!lead.next_action_at) return false;
  return new Date(lead.next_action_at).getTime() <= Date.now();
}
