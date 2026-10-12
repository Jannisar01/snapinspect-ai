
import React, { useState, useMemo } from 'react';
import { useInspection } from '../context/InspectionContext';
import { useAuth } from '../context/AuthContext';
import { Button, Badge, Input } from '../components/ui';
import ReactMarkdown from 'react-markdown';
import { 
  Trash2, ArrowRight, ArrowLeft, LayoutList, Edit, RotateCcw, 
  History, Clock, ShieldCheck, CheckCircle, Bot, Loader2, 
  Terminal, Search, ChevronDown, ChevronUp, MoreHorizontal, AlignLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Severity, Finding, LifecycleStatus, UserRole } from '../types';

const CollapsibleText: React.FC<{ title: string; content: string; icon?: React.ReactNode; defaultExpanded?: boolean; variant?: 'default' | 'dark' }> = ({ 
  title, content, icon, defaultExpanded = false, variant = 'default' 
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const isLong = content.length > 280;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest flex items-center gap-2">
          {icon} {title}
        </label>
        {isLong && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] font-bold text-[#2563EB] uppercase hover:underline flex items-center gap-1"
          >
            {isExpanded ? <><ChevronUp className="w-3 h-3" /> Condense</> : <><ChevronDown className="w-3 h-3" /> View Full Details</>}
          </button>
        )}
      </div>
      <div className={`
        relative rounded-xl border transition-all duration-300 p-5 text-sm leading-relaxed
        ${variant === 'dark' ? 'bg-[#1F2937] text-white border-transparent' : 'bg-[#F5F7FA] text-[#1F2937] border-[#E5E7EB]'}
        ${!isExpanded && isLong ? 'max-h-32 overflow-hidden' : 'max-h-[2000px]'}
      `}>
        <div className="prose prose-sm prose-slate max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        {!isExpanded && isLong && (
          <div className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t ${variant === 'dark' ? 'from-[#1F2937]' : 'from-[#F5F7FA]'} to-transparent pointer-events-none`}></div>
        )}
      </div>
    </div>
  );
};

const FindingsList: React.FC = () => {
  const { currentInspection, deleteFinding, restoreFinding, updateFinding } = useInspection();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [undoFinding, setUndoFinding] = useState<Finding | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleStatus | 'ALL'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'ALL'>('ALL');

  if (!currentInspection) {
    navigate('/');
    return null;
  }

  const filteredFindings = useMemo(() => {
    return currentInspection.findings.filter(f => {
      const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          f.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLifecycle = lifecycleFilter === 'ALL' || f.lifecycle === lifecycleFilter;
      const matchesSeverity = severityFilter === 'ALL' || f.severity === severityFilter;
      return matchesSearch && matchesLifecycle && matchesSeverity;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [currentInspection.findings, searchQuery, lifecycleFilter, severityFilter]);

  const getSeverityColor = (sev: Severity) => {
    switch (sev) {
      case Severity.CRITICAL: return 'red';
      case Severity.HIGH: return 'red';
      case Severity.MEDIUM: return 'yellow';
      case Severity.LOW: return 'blue';
      default: return 'gray';
    }
  };

  const getLifecycleColor = (status: LifecycleStatus) => {
    switch (status) {
      case 'OPEN': return 'red';
      case 'IN_PROGRESS': return 'yellow';
      case 'MITIGATED': return 'blue';
      case 'VERIFIED_CLOSED': return 'green';
      default: return 'gray';
    }
  };

  const handleDelete = (finding: Finding) => {
    setUndoFinding(finding);
    deleteFinding(finding.id);
    setShowUndo(true);
    setTimeout(() => setShowUndo(false), 5000);
  };

  const handleUndo = () => {
    if (undoFinding) { restoreFinding(undoFinding); setUndoFinding(null); setShowUndo(false); }
  };

  const cycleLifecycle = (finding: Finding) => {
    const sequence: LifecycleStatus[] = ['OPEN', 'IN_PROGRESS', 'MITIGATED', 'VERIFIED_CLOSED'];
    const currentIndex = sequence.indexOf(finding.lifecycle);
    const nextStatus = sequence[(currentIndex + 1) % sequence.length];
    
    if (nextStatus === 'VERIFIED_CLOSED' && user?.role !== UserRole.SUPERVISOR && user?.role !== UserRole.ADMIN) {
      alert("Supervisor validation required for closure.");
      return;
    }

    updateFinding(finding, "LIFECYCLE_TRANSITION", `State: ${nextStatus}`);
  };

  const toggleVerify = (finding: Finding) => {
    if (user?.role !== UserRole.SUPERVISOR && user?.role !== UserRole.ADMIN) {
      alert("Supervisor signature required.");
      return;
    }
    const newStatus = finding.status === 'APPROVED' ? 'AI_DRAFT' : 'APPROVED';
    updateFinding(finding, "VERIFICATION", `Status: ${newStatus}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 pb-32">
      
      {showUndo && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-[#1F2937] text-white px-8 py-5 shadow-2xl animate-in slide-in-from-bottom-10 flex items-center gap-6 rounded-xl border border-white/10">
           <div className="flex flex-col">
             <span className="text-[10px] font-bold uppercase tracking-widest text-[#2563EB]">Record Purged</span>
             <span className="text-xs text-[#9CA3AF]">Reversible for 5 seconds.</span>
           </div>
           <button onClick={handleUndo} className="bg-[#2563EB] px-4 py-2 text-white font-bold uppercase text-[10px] rounded-lg">REVERSE</button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 pb-10 border-b border-[#E5E7EB]">
        <div className="space-y-4">
          <button onClick={() => navigate('/workspace')} className="text-[#4B5563] hover:text-[#2563EB] flex items-center text-[10px] font-bold uppercase tracking-[0.3em]">
            <ArrowLeft className="w-4 h-4 mr-2" /> [ RETURN TO STAGE ]
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-5xl font-oswald font-bold text-[#1F2937] uppercase italic tracking-tighter">Site Manifest</h1>
            <Badge color="gray">Partition::{currentInspection.siteId.slice(0,8)}</Badge>
          </div>
          <p className="text-[#4B5563] font-bold uppercase text-[11px] tracking-widest">
            NODE_PROJECT: {currentInspection.name} | RECORD_COUNT: {filteredFindings.length}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
           <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <Input placeholder="SEARCH MANIFEST..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 h-12 text-[10px] font-bold uppercase" />
           </div>
           <Button onClick={() => navigate('/report')} className="h-12 bg-[#1F2937] px-8 text-[11px] tracking-widest">COMPILE REPORT <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>
      </div>

      <div className="space-y-8">
        {filteredFindings.length === 0 ? (
          <div className="py-24 bg-white border-2 border-dashed border-[#E5E7EB] rounded-3xl text-center flex flex-col items-center opacity-40">
             <LayoutList className="w-16 h-16 mb-4" />
             <p className="font-bold uppercase tracking-[0.3em] text-sm">Awaiting Record Synchronization</p>
          </div>
        ) : (
          filteredFindings.map((finding) => (
            <div key={finding.id} className="bg-white border border-[#E5E7EB] shadow-sm rounded-2xl overflow-hidden hover:border-[#2563EB] transition-all group">
              <div className="flex flex-col xl:flex-row">
                
                {/* Visual Pane */}
                <div className="xl:w-80 bg-[#F5F7FA] border-b xl:border-b-0 xl:border-r border-[#E5E7EB] p-6 flex flex-col shrink-0">
                  <div className="relative aspect-square mb-6 rounded-xl overflow-hidden shadow-inner group-hover:scale-[1.02] transition-transform">
                    <img src={finding.imageUrl} className="w-full h-full object-cover" alt="Finding Evidence" />
                    <div className="absolute top-2 right-2"><Badge color={getLifecycleColor(finding.lifecycle)}>{finding.lifecycle}</Badge></div>
                  </div>
                  <div className="mt-auto flex justify-between items-center text-[9px] font-bold text-[#9CA3AF] uppercase">
                    <span>SIGNAL_REF</span>
                    <span className="text-[#4B5563] font-mono">#{finding.id.slice(0,8)}</span>
                  </div>
                </div>

                {/* Content Pane */}
                <div className="flex-1 p-8 flex flex-col">
                  <header className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
                    <div className="space-y-3">
                       <h3 className="text-3xl font-oswald font-bold text-[#1F2937] uppercase italic tracking-tighter leading-none group-hover:text-[#2563EB] transition-colors">{finding.title}</h3>
                       <div className="flex flex-wrap items-center gap-4">
                          <Badge color={getSeverityColor(finding.severity)}>{finding.severity} PRIORITY</Badge>
                          <span className="text-[10px] font-bold text-[#4B5563] uppercase tracking-widest flex items-center gap-1"><MoreHorizontal className="w-3 h-3" /> {finding.category}</span>
                       </div>
                    </div>
                    <div className={`px-4 py-2 border rounded-lg flex flex-col items-center ${finding.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-200 text-[#059669]' : 'bg-[#EEF2F6] border-[#E5E7EB] text-[#4B5563]'}`}>
                      <span className="text-[8px] font-bold uppercase mb-1">DATA_STATUS</span>
                      <span className="text-xs font-bold uppercase flex items-center gap-1">
                        {finding.status === 'APPROVED' ? <CheckCircle className="w-3.5 h-3.5" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {finding.status}
                      </span>
                    </div>
                  </header>

                  <div className="grid gap-10">
                    <CollapsibleText title="Observation Summary" icon={<AlignLeft className="w-3 h-3" />} content={finding.description} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <CollapsibleText 
                        title="Mitigation Protocol" 
                        variant="dark" 
                        icon={<Bot className="w-3 h-3 text-[#2563EB]" />} 
                        content={finding.recommendedAction} 
                        defaultExpanded={true}
                       />
                       <CollapsibleText 
                        title="Compliance Node" 
                        icon={<ShieldCheck className="w-3 h-3 text-[#2563EB]" />} 
                        content={finding.regulatoryReference || 'Awaiting Legal Mapping.'} 
                       />
                    </div>
                  </div>

                  <footer className="mt-12 pt-6 border-t border-[#F5F7FA] flex flex-wrap items-center justify-between gap-6">
                     <div className="flex items-center gap-6">
                        <button onClick={() => setExpandedHistory(expandedHistory === finding.id ? null : finding.id)} className="text-[10px] font-bold text-[#4B5563] hover:text-[#2563EB] uppercase tracking-[0.2em] flex items-center gap-2">
                          <History className="w-4 h-4 text-[#9CA3AF]" /> AUDIT_TRAIL ({finding.history.length})
                        </button>
                        <div className="text-[9px] text-[#9CA3AF] font-mono flex items-center gap-2 uppercase">
                          <Clock className="w-3 h-3" /> {new Date(finding.timestamp).toLocaleString()}
                        </div>
                     </div>

                     <div className="flex items-center gap-3">
                        <Button onClick={() => toggleVerify(finding)} variant={finding.status === 'APPROVED' ? 'primary' : 'secondary'} className="h-9 px-6 text-[10px] tracking-widest font-bold">
                          {finding.status === 'APPROVED' ? 'REVOKE_SIGNATURE' : 'VERIFY_RECORD'}
                        </Button>
                        <button onClick={() => cycleLifecycle(finding)} className="px-4 h-9 bg-white border border-[#E5E7EB] text-[#4B5563] hover:border-[#2563EB] font-bold text-[10px] uppercase transition-all rounded-lg">
                          STATE: {finding.lifecycle}
                        </button>
                        <button onClick={() => navigate(`/workspace?edit=${finding.id}`)} className="p-2 text-[#9CA3AF] hover:text-[#2563EB]"><Edit className="w-5 h-5" /></button>
                        <button onClick={() => handleDelete(finding)} className="p-2 text-[#9CA3AF] hover:text-[#DC2626]"><Trash2 className="w-5 h-5" /></button>
                     </div>
                  </footer>
                </div>
              </div>

              {expandedHistory === finding.id && (
                <div className="bg-[#1F2937] p-10 border-t border-[#2563EB] animate-in slide-in-from-top duration-300">
                  <h4 className="text-[#2563EB] font-bold text-[10px] uppercase tracking-[0.5em] mb-10 flex items-center"><Terminal className="w-4 h-4 mr-3" /> LEDGER_MANIFEST</h4>
                  <div className="space-y-6 max-w-4xl border-l border-white/10 ml-2">
                    {finding.history.slice().reverse().map((entry) => (
                      <div key={entry.id} className="relative pl-8 pb-4">
                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-[#2563EB] rounded-full border-4 border-[#1F2937]"></div>
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                           <div className="w-40 shrink-0 text-[10px] font-mono text-[#9CA3AF]">{new Date(entry.timestamp).toLocaleString()}</div>
                           <div className="flex-1">
                              <div className="text-[11px] font-bold text-white uppercase tracking-wider">{entry.action} :: {entry.userId.slice(0,8)}</div>
                              <p className="text-[#9CA3AF] text-[11px] font-mono mt-1 italic">"{entry.details}"</p>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FindingsList;
