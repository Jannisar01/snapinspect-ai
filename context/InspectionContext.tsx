
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Inspection, Finding, Category, Severity, LifecycleStatus, AuditEntry, ReportSnapshot, UserRole } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';

interface InspectionContextType {
  inspections: Inspection[];
  currentInspection: Inspection | null;
  startNewInspection: (name: string) => void;
  loadInspection: (id: string) => void;
  deleteInspection: (id: string) => void;
  addImageToInspection: (file: File) => Promise<void>;
  addBase64ImageToInspection: (base64: string, name: string) => void;
  saveFinding: (finding: Omit<Finding, 'id' | 'timestamp' | 'status' | 'lifecycle' | 'history' | 'orgId'>) => void;
  restoreFinding: (finding: Finding) => void;
  updateFinding: (finding: Finding, action: string, details: string) => void;
  deleteFinding: (findingId: string) => void;
  clearCurrentInspection: () => void;
  saveInspectionReport: (content: string) => void;
  updateInspectionMetadata: (data: Partial<Inspection>) => void;
}

const InspectionContext = createContext<InspectionContextType | undefined>(undefined);

export const InspectionProvider: React.FC<{ children: ReactNode, accessCode: string }> = ({ children, accessCode }) => {
  const { user } = useAuth();
  // Multi-tenant isolation: storage is scoped to organization and project
  const STORAGE_KEY = `snap_enterprise_${user?.orgId || 'GLOBAL'}_${accessCode}`;

  const [inspections, setInspections] = useState<Inspection[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) { return []; }
    }
    return [];
  });

  const [currentInspection, setCurrentInspection] = useState<Inspection | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inspections));
  }, [inspections, STORAGE_KEY]);

  const startNewInspection = (name: string) => {
    if (!user) return;
    const newInspection: Inspection = {
      id: uuidv4(),
      orgId: user.orgId,
      siteId: `SITE-${uuidv4().slice(0, 8).toUpperCase()}`,
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      findings: [],
      images: [],
      reportContent: '',
      reportHistory: [],
      companyName: user.name + ' Corp',
      inspectionDate: new Date().toISOString().split('T')[0],
      reportId: `REP-${Math.floor(Math.random() * 100000)}`,
      inspectingOfficer: user.name,
      siteRepresentative: ''
    };
    setInspections(prev => [newInspection, ...prev]);
    setCurrentInspection(newInspection);
  };

  const loadInspection = (id: string) => {
    const found = inspections.find(i => i.id === id);
    if (found) setCurrentInspection(found);
  };

  const deleteInspection = (id: string) => {
    if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.SUPERVISOR) {
      alert("Insufficient permissions: Admin or Supervisor role required for deletion.");
      return;
    }
    setInspections(prev => prev.filter(i => i.id !== id));
    if (currentInspection?.id === id) setCurrentInspection(null);
  };

  const addBase64ImageToInspection = (base64: string, name: string) => {
    if (!currentInspection) return;
    const newImage = {
      id: uuidv4(),
      url: base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`,
      name
    };
    const updated = {
      ...currentInspection,
      images: [...currentInspection.images, newImage],
      updatedAt: Date.now()
    };
    setCurrentInspection(updated);
    setInspections(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  const addImageToInspection = async (file: File) => {
    if (!currentInspection) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const MAX = 1024;
        let w = img.width, h = img.height;
        if (w > h ? w > MAX : h > MAX) {
          if (w > h) { h *= MAX / w; w = MAX; } else { w *= MAX / h; h = MAX; }
        }
        canvas.width = w; canvas.height = h;
        ctx?.drawImage(img, 0, 0, w, h);
        addBase64ImageToInspection(canvas.toDataURL('image/jpeg', 0.8), file.name);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const saveFinding = (findingData: Omit<Finding, 'id' | 'timestamp' | 'status' | 'lifecycle' | 'history' | 'orgId'>) => {
    if (!currentInspection || !user) return;
    const initialAudit: AuditEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      userId: user.id,
      userRole: user.role,
      action: "INITIAL_LOGGING",
      details: "Observation recorded via AI Engine."
    };
    const newFinding: Finding = { 
      ...findingData, 
      id: uuidv4(), 
      orgId: user.orgId,
      timestamp: Date.now(),
      status: 'AI_DRAFT',
      lifecycle: 'OPEN',
      history: [initialAudit]
    };
    const updated = { ...currentInspection, findings: [...currentInspection.findings, newFinding], updatedAt: Date.now() };
    setCurrentInspection(updated);
    setInspections(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  const restoreFinding = (finding: Finding) => {
    if (!currentInspection) return;
    const updated = { ...currentInspection, findings: [...currentInspection.findings, finding], updatedAt: Date.now() };
    setCurrentInspection(updated);
    setInspections(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  const updateFinding = (updatedFinding: Finding, action: string, details: string) => {
    if (!currentInspection || !user) return;
    
    const audit: AuditEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      userId: user.id,
      userRole: user.role,
      action: action,
      details: details
    };
    
    const finalFinding = {
      ...updatedFinding,
      history: [...updatedFinding.history, audit]
    };
    
    const updated = { 
      ...currentInspection, 
      findings: currentInspection.findings.map(f => f.id === updatedFinding.id ? finalFinding : f), 
      updatedAt: Date.now() 
    };
    setCurrentInspection(updated);
    setInspections(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  const deleteFinding = (findingId: string) => {
    if (!currentInspection) return;
    const updated = { ...currentInspection, findings: currentInspection.findings.filter(f => f.id !== findingId), updatedAt: Date.now() };
    setCurrentInspection(updated);
    setInspections(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  const saveInspectionReport = (content: string) => {
    if (!currentInspection || !user) return;
    const snapshot: ReportSnapshot = {
      id: uuidv4(),
      version: currentInspection.reportHistory.length + 1,
      timestamp: Date.now(),
      content: content,
      metadata: {
        reportId: currentInspection.reportId || 'N/A',
        officer: user.name,
        hash: btoa(Math.random().toString()).slice(0, 32) // Simulated HMAC
      }
    };
    const updated = { 
      ...currentInspection, 
      reportContent: content, 
      reportHistory: [...currentInspection.reportHistory, snapshot],
      updatedAt: Date.now() 
    };
    setCurrentInspection(updated);
    setInspections(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  const updateInspectionMetadata = (data: Partial<Inspection>) => {
    if (!currentInspection) return;
    const updated = { ...currentInspection, ...data, updatedAt: Date.now() };
    setCurrentInspection(updated);
    setInspections(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  const clearCurrentInspection = () => setCurrentInspection(null);

  return (
    <InspectionContext.Provider value={{
      inspections, currentInspection, startNewInspection, loadInspection, deleteInspection,
      addImageToInspection, addBase64ImageToInspection, saveFinding, restoreFinding, updateFinding, deleteFinding,
      clearCurrentInspection, saveInspectionReport, updateInspectionMetadata
    }}>
      {children}
    </InspectionContext.Provider>
  );
};

export const useInspection = () => {
  const context = useContext(InspectionContext);
  if (!context) throw new Error("useInspection must be used within an InspectionProvider");
  return context;
};
