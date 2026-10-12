
export enum Severity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum Category {
  DAMAGE = 'Damage',
  HAZARD = 'Hazard',
  DEFECT = 'Defect',
  MAINTENANCE = 'Maintenance',
  OTHER = 'Other'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  INSPECTOR = 'INSPECTOR',
  VIEWER = 'VIEWER'
}

export type LifecycleStatus = 'OPEN' | 'IN_PROGRESS' | 'MITIGATED' | 'VERIFIED_CLOSED';
export type FindingStatus = 'AI_DRAFT' | 'APPROVED';
export type ConfidenceLevel = 'Low' | 'Medium' | 'High';

export interface RegulatoryStandard {
  id: string;
  code: string;
  title: string;
  description: string;
  url: string;
  relevanceScore?: number;
}

export interface AuditEntry {
  id: string;
  timestamp: number;
  userId: string;
  userRole: UserRole;
  action: string;
  details: string;
  previousValue?: string;
  newValue?: string;
}

// Added ReportSnapshot interface to track document revisions
export interface ReportSnapshot {
  id: string;
  version: number;
  timestamp: number;
  content: string;
  metadata: {
    reportId: string;
    officer: string;
    hash: string;
  };
}

export interface Finding {
  id: string;
  imageId: string;
  imageUrl: string; 
  title: string;
  description: string;
  category: Category;
  severity: Severity;
  recommendedAction: string;
  regulatoryReference?: string;
  linkedStandards?: RegulatoryStandard[]; // Link to knowledge base
  timestamp: number;
  status: FindingStatus;
  lifecycle: LifecycleStatus;
  confidence?: ConfidenceLevel;
  confidenceBreakdown?: {
    visual: number;
    textual: number;
    regulatory: number;
  };
  orgId: string;
  history: AuditEntry[]; 
}

export interface Inspection {
  id: string;
  orgId: string;
  name: string;
  siteId: string;
  createdAt: number;
  updatedAt: number;
  findings: Finding[];
  images: Array<{
    id: string;
    url: string; 
    name: string;
  }>;
  reportContent?: string;
  reportHistory: ReportSnapshot[];
  companyName?: string;
  inspectionDate?: string;
  reportId?: string;
  inspectingOfficer?: string;
  siteRepresentative?: string;
}

export interface AIAnalysisResult {
  title: string;
  description: string;
  category: Category;
  severity: Severity;
  recommendedAction: string;
  regulatoryReference?: string;
  confidence?: ConfidenceLevel;
  linkedStandards?: RegulatoryStandard[];
  visualConfidence?: number;
  regulatoryConfidence?: number;
  /** a reference the model gave that is not in the certified registry; never used as the finding's reference */
  unverifiedReference?: string;
}
