import { describe, expect, it } from 'vitest';
import {
  buildFindingsSummary,
  checkReference,
  enforceRegistry,
  findUnregisteredCitations,
  resolveStandard,
  selectReportFindings,
} from './standardsGuard';
import { AUTHENTICATED_STANDARDS } from './standardsData';
import { AIAnalysisResult, Category, Finding, Severity } from '../types';

const base: AIAnalysisResult = {
  title: 'Unprotected edge',
  description: 'Open edge on the second floor deck.',
  category: Category.HAZARD,
  severity: Severity.HIGH,
  recommendedAction: 'Install guardrails.',
};

function finding(over: Partial<Finding>): Finding {
  return {
    id: over.id ?? 'f1',
    imageId: 'img',
    imageUrl: '',
    title: 'Finding',
    description: 'Observation',
    category: Category.HAZARD,
    severity: Severity.HIGH,
    recommendedAction: 'Fix it',
    timestamp: 0,
    status: 'AI_DRAFT',
    lifecycle: 'OPEN',
    orgId: 'org',
    history: [],
    ...over,
  };
}

describe('resolveStandard', () => {
  it('resolves every registry code to itself', () => {
    for (const std of AUTHENTICATED_STANDARDS) expect(resolveStandard(std.code)?.id).toBe(std.id);
  });

  it('accepts spacing, case, the section sign and a paragraph suffix', () => {
    expect(resolveStandard('29 cfr §1926.501')?.code).toBe('29 CFR 1926.501');
    expect(resolveStandard('29  CFR 1926.501(b)(1)')?.code).toBe('29 CFR 1926.501');
    expect(resolveStandard('iso 45001:2018')?.code).toBe('ISO 45001:2018');
  });

  it('rejects codes outside the registry and partial matches', () => {
    expect(resolveStandard('29 CFR 1910.23')).toBeUndefined(); // real OSHA code, not in the registry
    expect(resolveStandard('29 CFR 1926.5011')).toBeUndefined();
    expect(resolveStandard('1926')).toBeUndefined(); // the old substring match accepted this
    expect(resolveStandard('ANSI Z359.1')).toBeUndefined();
    expect(resolveStandard('')).toBeUndefined();
  });
});

describe('checkReference', () => {
  it('classifies references', () => {
    expect(checkReference('29 CFR 1910.147').status).toBe('REGISTRY');
    expect(checkReference('29 CFR 1910.157').status).toBe('UNREGISTERED');
    expect(checkReference('  ').status).toBe('NONE');
    expect(checkReference(undefined).status).toBe('NONE');
  });
});

describe('enforceRegistry', () => {
  it('keeps a registry code, canonicalised', () => {
    const out = enforceRegistry({ ...base, regulatoryReference: '29 cfr 1926.501(b)(1)' });
    expect(out.regulatoryReference).toBe('29 CFR 1926.501');
    expect(out.unverifiedReference).toBeUndefined();
    expect(out.linkedStandards?.map((s) => s.code)).toEqual(['29 CFR 1926.501']);
  });

  it('removes an unregistered code and keeps it only as an unverified suggestion', () => {
    const out = enforceRegistry({ ...base, regulatoryReference: '29 CFR 1910.23' });
    expect(out.regulatoryReference).toBe('');
    expect(out.unverifiedReference).toBe('29 CFR 1910.23');
    expect(out.linkedStandards).toEqual([]);
  });

  it('rebuilds linked standards from the registry, dropping invented ones and model-written URLs', () => {
    const out = enforceRegistry({
      ...base,
      regulatoryReference: '29 CFR 1926.451',
      linkedStandards: [
        { id: 'x', code: 'ISO 45001:2018', title: 'Made-up title', description: '', url: 'https://example.com/fake' },
        { id: 'y', code: 'ANSI Z359.1', title: 'Fall Protection Code', description: '', url: 'https://example.com' },
        { id: 'z', code: '29 CFR 1926.451', title: 'Duplicate', description: '', url: '' },
      ],
    });
    expect(out.linkedStandards?.map((s) => s.code)).toEqual(['29 CFR 1926.451', 'ISO 45001:2018']);
    const iso = out.linkedStandards?.find((s) => s.code === 'ISO 45001:2018');
    expect(iso?.url).toBe('https://www.iso.org/standard/63787.html');
    expect(iso?.title).toBe('Occupational Health and Safety Management Systems');
  });

  it('leaves a finding with no reference without one', () => {
    const out = enforceRegistry({ ...base });
    expect(out.regulatoryReference).toBe('');
    expect(out.unverifiedReference).toBeUndefined();
  });
});

describe('report building', () => {
  const findings = [
    finding({ id: 'a', title: 'Approved, registry', status: 'APPROVED', regulatoryReference: '29 CFR 1926.501' }),
    finding({ id: 'b', title: 'Approved, unregistered', status: 'APPROVED', regulatoryReference: '29 CFR 1910.23' }),
    finding({ id: 'c', title: 'Draft', status: 'AI_DRAFT', regulatoryReference: '29 CFR 1926.651' }),
  ];

  it('includes only verified findings', () => {
    const { included, excludedDrafts } = selectReportFindings({ findings });
    expect(included.map((f) => f.id)).toEqual(['a', 'b']);
    expect(excludedDrafts.map((f) => f.id)).toEqual(['c']);
  });

  it('never passes an unregistered code or a draft to the report prompt', () => {
    const summary = buildFindingsSummary(selectReportFindings({ findings }).included);
    expect(summary).toContain('29 CFR 1926.501 (Fall Protection - Duty to have fall protection)');
    expect(summary).toContain('None from the certified registry');
    expect(summary).not.toContain('1910.23');
    expect(summary).not.toContain('Draft');
  });
});

describe('findUnregisteredCitations', () => {
  it('finds regulation codes in report text that are not in the registry', () => {
    const text =
      'Guardrails per 29 CFR 1926.501(b)(1) and ISO 45001. Also see 29 CFR 1910.23, §1910.157 and ANSI Z359.1. ' +
      'Excavation: 1926.651.';
    expect(findUnregisteredCitations(text).sort()).toEqual(['1910.157', '29 CFR 1910.23', 'ANSI Z359.1'].sort());
  });

  it('returns nothing for a clean report', () => {
    expect(findUnregisteredCitations('Ladders must meet 29 CFR 1926.1053. Inspection date 2026-10-11.')).toEqual([]);
  });
});
