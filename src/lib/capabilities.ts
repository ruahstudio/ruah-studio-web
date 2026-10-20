/**
 * Maps each capability label to the public pillar it belongs under.
 *
 * This used to also carry a `stack` list and a `flow` array ("Trigger →
 * Classify → Act → Notify"). Both were rendered only by the capability
 * explorer, which was deleted for being decorative pseudo-data — so they had
 * been dead weight ever since. Only the category is still read, by
 * Capabilities.tsx, to group items into the three pillars.
 *
 * The category is never displayed, so it needs no translation: it is a
 * grouping key, not a word the visitor reads.
 */

export type CapabilityCategory = "AI" | "DATA" | "OPS" | "PRODUCT" | "INTERFACE";

export type CapabilityMeta = {
  category: CapabilityCategory;
};

/** Strip accents, lowercase, collapse to single words for stable lookup. */
export function capabilityKey(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

const RAW: Record<string, CapabilityMeta> = {
  aiassistants: {
    category: "AI",
  },
  aiautomation: {
    category: "AI",
  },
  businessdashboards: {
    category: "DATA",
  },
  crms: {
    category: "OPS",
  },
  interactivecalculators: {
    category: "INTERFACE",
  },
  internaltools: {
    category: "OPS",
  },
  landingpages: {
    category: "INTERFACE",
  },
  webapplications: {
    category: "PRODUCT",
  },
  mvps: {
    category: "PRODUCT",
  },
  creatorplatforms: {
    category: "PRODUCT",
  },
  customsoftware: {
    category: "PRODUCT",
  },
};

/** Fallback keeps the explorer functional for capabilities added later in the CMS. */
const FALLBACK: CapabilityMeta = {
  category: "PRODUCT",
};

export function capabilityMeta(label: string): CapabilityMeta {
  return RAW[capabilityKey(label)] ?? FALLBACK;
}
