
import React, { useState } from 'react';
import { Search, Book, ExternalLink, ShieldAlert, CheckCircle, Info, Database } from 'lucide-react';
import { Card, Input, Badge, Button } from '../components/ui';

const KnowledgeBase: React.FC = () => {
  const [query, setQuery] = useState('');

  const standards = [
    { id: '1', code: '29 CFR 1910.23', title: 'Ladders & Stairways', desc: 'Requirements for fixed and portable ladders used in general industry.', type: 'OSHA' },
    { id: '2', code: 'ISO 45001', title: 'Occupational Health & Safety', desc: 'Framework for managing health and safety risks in complex environments.', type: 'ISO' },
    { id: '3', code: '29 CFR 1910.157', title: 'Portable Fire Extinguishers', desc: 'Placement, use, and testing of fire suppression systems.', type: 'OSHA' },
    { id: '4', code: 'ANSI Z359.1', title: 'Fall Protection Code', desc: 'Requirements for safety harnesses and fall arrest systems.', type: 'ANSI' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-[#E5E7EB] pb-8">
        <div>
           <div className="flex items-center gap-3 text-[#2563EB] mb-2">
             <Database className="w-6 h-6" />
             <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Regulatory_Nexus</span>
           </div>
           <h1 className="text-5xl font-oswald font-bold text-[#1F2937] uppercase italic tracking-tighter">Compliance Library</h1>
           <p className="text-[#4B5563] font-bold uppercase tracking-widest mt-2">Verified Ground Truth Knowledge Base</p>
        </div>
        <div className="relative w-full md:w-96">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
           <Input 
             placeholder="SEARCH STANDARDS..." 
             value={query} 
             onChange={e => setQuery(e.target.value)}
             className="pl-10 h-12 font-bold"
           />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid gap-6">
           {standards.map(std => (
             <div key={std.id} className="bg-white border border-[#E5E7EB] p-6 rounded-xl shadow-sm hover:border-[#2563EB] transition-all group">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                      <div className="bg-[#1F2937] text-white px-3 py-1 text-[10px] font-bold font-mono group-hover:bg-[#2563EB] transition-colors rounded">
                        {std.code}
                      </div>
                      <Badge color={std.type === 'OSHA' ? 'red' : 'blue'}>{std.type}</Badge>
                   </div>
                   <button className="text-[#9CA3AF] hover:text-[#2563EB] transition-colors">
                      <ExternalLink className="w-4 h-4" />
                   </button>
                </div>
                <h3 className="text-2xl font-oswald font-bold text-[#1F2937] uppercase mb-3">{std.title}</h3>
                <p className="text-[#4B5563] text-sm leading-relaxed mb-6">{std.desc}</p>
                <div className="flex items-center justify-between pt-4 border-t border-[#F5F7FA]">
                   <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Revision: 2025.A-LIVE</span>
                   <button className="text-[10px] font-bold text-[#2563EB] uppercase hover:underline">Link Manifest</button>
                </div>
             </div>
           ))}
        </div>

        <div className="space-y-8">
           <div className="bg-[#1F2937] p-8 text-white rounded-xl space-y-6 shadow-lg">
              <h4 className="font-oswald font-bold text-lg uppercase tracking-widest border-l-4 border-[#2563EB] pl-4">Reliability Metrics</h4>
              <div className="space-y-4">
                 <ReliabilityItem label="Grounding Accuracy" value={98.4} />
                 <ReliabilityItem label="Citation Integrity" value={100} />
                 <ReliabilityItem label="Pixel Analysis Conf" value={92.1} />
              </div>
              <p className="text-[9px] font-mono text-[#9CA3AF] leading-relaxed uppercase pt-4">
                *Knowledge base synchronized with ISO/OSHA streams.
              </p>
           </div>

           <div className="bg-[#EEF2F6] border border-[#E5E7EB] p-6 rounded-xl space-y-4">
              <div className="flex items-center gap-3 text-[#2563EB]">
                 <ShieldAlert className="w-5 h-5" />
                 <span className="text-xs font-bold uppercase">Update Advisory</span>
              </div>
              <p className="text-xs text-[#4B5563] leading-relaxed font-medium">
                 OSHA has updated <strong>1910 Subpart D</strong> regarding walking-working surfaces. AI Linking has been re-indexed.
              </p>
              <Button variant="outline" className="w-full text-[10px]">Re-Audit Historical Data</Button>
           </div>
        </div>
      </div>
    </div>
  );
};

const ReliabilityItem = ({ label, value }: { label: string, value: number }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
      <span className="text-[#9CA3AF]">{label}</span>
      <span className="text-[#059669] font-mono">{value}%</span>
    </div>
    <div className="h-1 bg-white/10 w-full rounded-full overflow-hidden">
       <div className="h-full bg-[#059669]" style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

export default KnowledgeBase;
