import { CATEGORIES } from "../types";

const RULES: { keywords: string[]; category: string }[] = [
  { keywords: ["junior", "trainee", "intern", "becario"], category: "Analista Junior" },
  { keywords: ["senior", "especialista", "specialist", "tech lead", "lead"], category: "Analista Senior" },
  { keywords: ["manager", "jefe", "responsable", "coordinator", "coordinador"], category: "Project Manager" },
  { keywords: ["director", "head of", "vp", "vice president"], category: "Director" },
  { keywords: ["ceo", "cto", "cfo", "coo", "ciso", "c-level", "chief"], category: "C-Level" },
];

export function mapJobTitleToCategory(jobTitle: string): string | null {
  const lower = jobTitle.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      const match = CATEGORIES.find((c) => c.name === rule.category);
      return match ? match.name : null;
    }
  }
  return null;
}
