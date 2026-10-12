
import { RegulatoryStandard } from '../types';

/**
 * AUTHENTICATED REGULATORY REGISTRY
 * This is the "Ground Truth" library used to anchor AI findings to certified data.
 */
export const AUTHENTICATED_STANDARDS: RegulatoryStandard[] = [
  {
    id: 'OSHA-29-1926-651',
    code: '29 CFR 1926.651',
    title: 'Specific Excavation Requirements',
    description: 'Protection of employees in excavations. Requirements for shoring, sloping, and structural ramps.',
    url: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.651'
  },
  {
    id: 'OSHA-29-1926-501',
    code: '29 CFR 1926.501',
    title: 'Fall Protection - Duty to have fall protection',
    description: 'Each employee on a walking/working surface with an unprotected side or edge 6 feet or more above a lower level shall be protected from falling.',
    url: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.501'
  },
  {
    id: 'OSHA-29-1910-147',
    code: '29 CFR 1910.147',
    title: 'Control of Hazardous Energy (Lockout/Tagout)',
    description: 'Servicing and maintenance of machines and equipment in which the unexpected energization or start up could cause injury.',
    url: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147'
  },
  {
    id: 'OSHA-29-1926-451',
    code: '29 CFR 1926.451',
    title: 'Scaffolding General Requirements',
    description: 'Capacity, construction, and safety protocols for supported and suspended scaffolds.',
    url: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.451'
  },
  {
    id: 'ISO-45001-2018',
    code: 'ISO 45001:2018',
    title: 'Occupational Health and Safety Management Systems',
    description: 'International standard specifying requirements for an OH&S management system.',
    url: 'https://www.iso.org/standard/63787.html'
  },
  {
    id: 'OSHA-29-1926-1053',
    code: '29 CFR 1926.1053',
    title: 'Ladders',
    description: 'General requirements for all ladders used in construction.',
    url: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.1053'
  }
];

// Look up a reference with resolveStandard in standardsGuard.ts (exact code match).
