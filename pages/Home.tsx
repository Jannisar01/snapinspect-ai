import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInspection } from '../context/InspectionContext';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';
import { 
  Plus, FolderOpen, Trash2, Calendar, FileText, 
  AlertTriangle, X, Lock, KeyRound, ChevronRight,
  ShieldCheck, BarChart3, TrendingUp, Users, MapPin, Zap, ShieldAlert
} from 'lucide-react';
import { Severity } from '../types';

const Home: React.FC = () => {
  const { inspections, startNewInspection, loadInspection, deleteInspection } = useInspection();
  const { user, projectKey, verifyProject } = useAuth();
  const navigate = useNavigate();
  
  const [newInspectionName, setNewInspectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [projectTokenInput, setProjectTokenInput] = useState('');
  const [tokenError, setTokenError] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);

  const stats = useMemo(() => {
    const allFindings = inspections.flatMap(i => i.findings);
    const criticalFindings = allFindings.filter(f => f.severity === Severity.CRITICAL).length;
    const openItems = allFindings.filter(f => f.lifecycle === 'OPEN').length;
    return { total: allFindings.length, critical: criticalFindings, open: openItems, reports: inspections.reduce((acc, i) => acc + (i.reportHistory.length > 0 ? 1 : 0), 0) };
  }, [inspections]);

  const handleStart = () => {
    if (!newInspectionName.trim()) return;
    startNewInspection(newInspectionName);
    navigate('/workspace');
  };

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyProject(projectTokenInput)) {
      setTokenError(false);
    } else {
      setTokenError(true);
    }
  };

  return (
    <div className="flex flex-col flex-grow bg-[#F5F7FA]">
      
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-[#DC2626] p-4 flex items-center justify-between text-white">
              <h3 className="font-oswald font-bold text-lg uppercase tracking-wider">Confirm Purge</h3>
              <X className="w-6 h-6 cursor-pointer" onClick={() => setDeleteTarget(null)} />
            </div>
            <div className="p-8 text-center space-y-6">
              <p className="text-[#1F2937] font-semibold">Delete project <span className="text-[#DC2626] underline">"{deleteTarget.name}"</span>?</p>
              <div className="flex gap-4">
                <Button onClick={() => setDeleteTarget(null)} variant="secondary" className="flex-1">CANCEL</Button>
                <Button onClick={() => { deleteInspection(deleteTarget.id); setDeleteTarget(null); }} variant="danger" className="flex-1">DELETE</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Corporate Dashboard Header */}
      <div className="bg-[#2563EB] relative overflow-hidden shadow-inner">
        <div className="max-w-[1600px] mx-auto px-8 py-16 relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
            <div className="space-y-5">
              <div className="inline-flex items-center px-3 py-1 bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/20">
                <ShieldCheck className="w-3 h-3 mr-2" /> Authorized Node :: {user?.orgId}
              </div>
              <h1 className="font-oswald text-5xl font-bold text-white uppercase tracking-tight italic">
                 Project <span className="text-white/60">Manifest</span> Dashboard
              </h1>
              <p className="text-white/70 font-medium text-sm border-l-2 border-white/30 pl-4">
                Inspection Lifecycle Hub | Logged in as {user?.name}
              </p>
            </div>

            {projectKey && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Critical" value={stats.critical} color="red" />
                <StatCard label="Open Items" value={stats.open} color="amber" />
                <StatCard label="Reports" value={stats.reports} color="emerald" />
                <StatCard label="Total Findings" value={stats.total} color="blue" />
              </div>
            )}
          </div>
          
          {!projectKey && (
            <div className="max-w-md mt-12 bg-white p-8 rounded-xl shadow-2xl border border-[#E5E7EB]">
               <div className="flex items-center gap-3 mb-4 text-[#2563EB]">
                 <Lock className="w-5 h-5" />
                 <h2 className="text-lg font-oswald font-bold uppercase">Project Authentication</h2>
               </div>
               <form onSubmit={handleTokenSubmit} className="space-y-4">
                  <Input 
                    placeholder="ENTER SITE TOKEN" 
                    value={projectTokenInput}
                    onChange={e => setProjectTokenInput(e.target.value)}
                    className={tokenError ? 'border-[#DC2626]' : ''}
                  />
                  <Button type="submit" className="w-full py-4 uppercase font-bold tracking-widest">
                    Link Project Data
                  </Button>
               </form>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 py-12 w-full flex-grow grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-5">
             <h2 className="text-2xl font-oswald font-bold text-[#1F2937] uppercase flex items-center">
                <MapPin className="w-6 h-6 mr-3 text-[#2563EB]" /> Active Projects
              </h2>
             {projectKey && (
               <Button onClick={() => setIsCreating(true)} className="px-6">
                 <Plus className="w-4 h-4 mr-2" /> Start New
               </Button>
             )}
          </div>

          {isCreating && (
            <div className="bg-white border-2 border-[#2563EB]/20 p-8 rounded-xl shadow-lg animate-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-oswald font-bold uppercase text-[#1F2937]">Create Inspection</h3>
                <X className="w-6 h-6 cursor-pointer text-[#9CA3AF]" onClick={() => setIsCreating(false)} />
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input placeholder="Site Name (e.g. Refinery Block 4)" value={newInspectionName} onChange={(e) => setNewInspectionName(e.target.value)} />
                </div>
                <Button onClick={handleStart} disabled={!newInspectionName.trim()} className="px-10">INITIATE</Button>
              </div>
            </div>
          )}
          
          <div className="grid gap-6 md:grid-cols-2">
            {inspections.length === 0 ? (
               <div className="col-span-2 py-20 bg-white border border-[#E5E7EB] rounded-xl flex flex-col items-center justify-center opacity-40">
                 <FolderOpen className="w-12 h-12 mb-4" />
                 <p className="font-bold uppercase tracking-widest text-xs">No active projects localized</p>
               </div>
            ) : inspections.map(insp => (
              <SiteCard 
                key={insp.id} 
                inspection={insp} 
                onOpen={() => { loadInspection(insp.id); navigate('/workspace'); }} 
                onDelete={(e) => { e.stopPropagation(); setDeleteTarget({ id: insp.id, name: insp.name }); }} 
              />
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white border border-[#E5E7EB] p-8 rounded-xl shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-oswald font-bold text-[#1F2937] uppercase">Site Telemetry</h3>
                <BarChart3 className="w-5 h-5 text-[#2563EB]" />
             </div>
             <div className="space-y-6">
                <TelemetryBar label="Standard Integrity" value={92} color="emerald" />
                <TelemetryBar label="Node Activity" value={68} color="blue" />
                <TelemetryBar label="Risk Ratio" value={42} color="amber" />
             </div>
          </div>

          <div className="bg-[#1F2937] p-8 rounded-xl text-white shadow-lg border-l-4 border-[#2563EB]">
             <div className="flex items-center gap-3 mb-4 text-[#2563EB]">
                <Zap className="w-5 h-5 fill-current" />
                <h4 className="text-xs font-bold uppercase tracking-widest">Neural Advisory</h4>
             </div>
             <p className="text-xs text-white/60 leading-relaxed font-medium">
                Standard mapping engine is active. All findings are being cross-referenced against OSHA and ISO repositories.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fix: Use React.FC to properly handle React props like 'key' and avoid TypeScript definition errors.
const StatCard: React.FC<{ label: string, value: number, color: string }> = ({ label, value, color }) => {
  const colors: Record<string, string> = {
    red: "text-[#DC2626]",
    amber: "text-[#D97706]",
    emerald: "text-[#059669]",
    blue: "text-white"
  };
  return (
    <div className="bg-white/10 backdrop-blur-md p-4 border border-white/20 rounded-xl min-w-[120px]">
      <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-2xl font-oswald font-bold ${colors[color] || 'text-white'}`}>{value}</div>
    </div>
  );
};

// Fix: Use React.FC to properly handle React props like 'key' and avoid TypeScript definition errors.
const SiteCard: React.FC<{ inspection: any, onOpen: () => void, onDelete: (e: any) => void }> = ({ inspection, onOpen, onDelete }) => (
  <div onClick={onOpen} className="bg-white border border-[#E5E7EB] p-6 rounded-xl cursor-pointer group hover:border-[#2563EB] transition-all hover:shadow-lg relative overflow-hidden">
    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#E5E7EB] group-hover:bg-[#2563EB] transition-colors"></div>
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">{inspection.siteId}</span>
      <button onClick={onDelete} className="text-[#9CA3AF] hover:text-[#DC2626] transition-colors"><Trash2 className="w-4 h-4" /></button>
    </div>
    <h3 className="font-oswald font-bold text-2xl text-[#1F2937] uppercase italic mb-6 group-hover:text-[#2563EB] transition-colors">{inspection.name}</h3>
    <div className="flex justify-between items-end border-t border-[#F5F7FA] pt-4">
       <div className="flex gap-4">
         <div className="flex flex-col">
            <span className="text-[9px] font-bold text-[#9CA3AF] uppercase">Findings</span>
            <span className="text-sm font-bold text-[#4B5563]">{inspection.findings.length}</span>
         </div>
         <div className="flex flex-col">
            <span className="text-[9px] font-bold text-[#9CA3AF] uppercase">Reports</span>
            <span className="text-sm font-bold text-[#4B5563]">{inspection.reportHistory.length}</span>
         </div>
       </div>
       <ChevronRight className="w-5 h-5 text-[#E5E7EB] group-hover:text-[#2563EB] transform group-hover:translate-x-1 transition-all" />
    </div>
  </div>
);

// Fix: Use React.FC to properly handle React props like 'key' and avoid TypeScript definition errors.
const TelemetryBar: React.FC<{ label: string, value: number, color: 'blue' | 'emerald' | 'amber' | 'red' }> = ({ label, value, color }) => {
  const colors = {
    blue: "bg-[#2563EB]",
    emerald: "bg-[#059669]",
    amber: "bg-[#D97706]",
    red: "bg-[#DC2626]"
  };
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
        <span className="text-[#4B5563]">{label}</span>
        <span className="text-[#1F2937]">{value}%</span>
      </div>
      <div className="h-1.5 bg-[#F5F7FA] w-full rounded-full overflow-hidden">
        <div className={`h-full ${colors[color]} rounded-full`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
};

export default Home;