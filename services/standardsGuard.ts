// Enforces the certified registry in code. The prompt asks the model to cite only registry codes;
// these functions check that it did, and keep anything else out of findings and reports.
import { AIAnalysisResult, Finding, Inspection, RegulatoryStandard } from '../types';
import { AUTHENTICATED_STANDARDS } from './standardsData';

export type ReferenceStatus = 'REGISTRY' | 'UNREGISTERED' | 'NONE';

export interface ReferenceCheck {
  status: ReferenceStatus;
  /** the registry entry when status is REGISTRY */
  standard?: RegulatoryStandard;
}

/** Uppercase, "§" and "PART" removed, spacing collapsed: "29 cfr §1926.501" -> "29 CFR 1926.501". */
export function normalizeCode(code: string): string {
  return (code || '')
    .toUpperCase()
    .replace(/§/g, ' ')
    .replace(/\bPART\b/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*([.:])\s*/g, '$1')
    .trim();
}

/**
 * The registry entry a reference points to, or undefined. The reference must be the exact code,
 * optionally followed by a paragraph such as "(b)(1)": "29 CFR 1926.501(b)(1)" resolves to
 * 1926.501, but "29 CFR 1926.5011", "1926" or "29 CFR 1910.23" do not resolve to anything.
 */
export function resolveStandard(
  reference: string,
  registry: RegulatoryStandard[] = AUTHENTICATED_STANDARDS,
): RegulatoryStandard | undefined {
  const ref = normalizeCode(reference);
  if (!ref) return undefined;
  return registry.find((std) => {
    const code = normalizeCode(std.code);
    if (ref === code) return true;
    if (!ref.startsWith(code)) return false;
    return /^\s*\(/.test(ref.slice(code.length)); // a paragraph like (b)(1), not more digits
  });
}

export function checkReference(reference: string | undefined): ReferenceCheck {
  if (!reference || !reference.trim()) return { status: 'NONE' };
  const standard = resolveStandard(reference);
  return standard ? { status: 'REGISTRY', standard } : { status: 'UNREGISTERED' };
}

/**
 * Applies the registry to a model result. A registry code is kept (canonicalised); anything else
 * is removed from regulatoryReference and kept only as unverifiedReference, so the UI can show
 * what the model suggested without presenting it as a certified match. linkedStandards are
 * rebuilt from the registry, so titles and URLs come from the registry, never from the model.
 */
export function enforceRegistry<T extends AIAnalysisResult>(result: T): T & { unverifiedReference?: string } {
  const suggested = (result.regulatoryReference || '').trim();
  const primary = suggested ? resolveStandard(suggested) : undefined;

  const linked: RegulatoryStandard[] = [];
  const add = (std?: RegulatoryStandard) => {
    if (std && !linked.some((s) => s.id === std.id)) linked.push(std);
  };
  add(primary);
  for (const std of result.linkedStandards || []) add(resolveStandard(std?.code || ''));

  const out: T & { unverifiedReference?: string } = {
    ...result,
    regulatoryReference: primary ? primary.code : '',
    linkedStandards: linked,
  };
  if (suggested && !primary) out.unverifiedReference = suggested;
  else delete out.unverifiedReference;
  return out;
}

/** Only supervisor-verified findings go into a report; drafts are counted, not included. */
export function selectReportFindings(inspection: Pick<Inspection, 'findings'>): {
  included: Finding[];
  excludedDrafts: Finding[];
} {
  const included: Finding[] = [];
  const excludedDrafts: Finding[] = [];
  for (const f of inspection.findings || []) (f.status === 'APPROVED' ? included : excludedDrafts).push(f);
  return { included, excludedDrafts };
}

/** The reference line a report prompt gets for a finding. Unregistered codes never reach the model. */
export function reportReferenceLine(finding: Pick<Finding, 'regulatoryReference'>): string {
  const check = checkReference(finding.regulatoryReference);
  if (check.status === 'REGISTRY') return `${check.standard!.code} (${check.standard!.title})`;
  return 'None from the certified registry';
}

/** The findings block of the report prompt, built from verified findings only. */
export function buildFindingsSummary(findings: Finding[]): string {
  return findings
    .map(
      (f) =>
        `## ${f.title}\n- **Ref**: ${reportReferenceLine(f)}\n- **Priority**: ${f.severity}\n- **Observation**: ${f.description}`,
    )
    .join('\n\n');
}

/**
 * Regulation codes in generated report text that are not in the registry (the report model can
 * still write one on its own). Matches CFR sections ("29 CFR 1926.501", "1910.23") and
 * ISO/ANSI standard numbers.
 */
export function findUnregisteredCitations(text: string): string[] {
  const found = new Set<string>();
  const patterns = [
    /\b(?:29\s*C\.?F\.?R\.?\s*(?:§\s*)?(?:PART\s*)?)?(19(?:10|26)\.\d+)(?:\s*\([a-z0-9]+\))*/gi,
    /\bISO\s*\d{4,5}(?::\d{4})?/gi,
    /\bANSI\s*[A-Z]?\d+(?:\.\d+)*/gi,
  ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const raw = m[0].trim();
      const asCfr = /^19(10|26)\./.test(raw) ? `29 CFR ${raw}` : raw;
      if (!resolveStandard(asCfr) && !isRegistryIsoWithoutYear(raw)) found.add(raw);
    }
  }
  return [...found];
}

/** "ISO 45001" without the year still names the registry's ISO 45001:2018. */
function isRegistryIsoWithoutYear(raw: string): boolean {
  const ref = normalizeCode(raw);
  return AUTHENTICATED_STANDARDS.some((s) => normalizeCode(s.code).split(':')[0] === ref);
}
