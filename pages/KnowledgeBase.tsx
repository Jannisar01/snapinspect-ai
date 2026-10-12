
import React, { useState } from 'react';
import { Search, Book, ExternalLink, ShieldAlert, CheckCircle, Info, Database } from 'lucide-react';
import { Card, Input, Badge, Button } from '../components/ui';
import { AUTHENTICATED_STANDARDS } from '../services/standardsData';

const KnowledgeBase: React.FC = () => {
  const [query, setQuery] = useState('');

  // the same six standards the model is given and the code enforces (services/standardsGuard.ts)
  const q = query.trim().toLowerCase();
  const standards = AUTHENTICATED_STANDARDS
    .map(s => ({ id: s.id, code: s.code, title: s.title, desc: s.description, url: s.url, type: s.code.startsWith('ISO') ? 'ISO' : 'OSHA' }))
    .filter(s => !q || `${s.code} ${s.title} ${s.desc}`.toLowerCase().includes(q));

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
                   <a href={std.url} target="_blank" rel="noopener noreferrer" className="text-[#9CA3AF] hover:text-[#2563EB] transition-colors">
                      <ExternalLink className="w-4 h-4" />
                   </a>
                </div>
                <h3 className="text-2xl font-oswald font-bold text-[#1F2937] uppercase mb-3">{std.title}</h3>
                <p className="text-[#4B5563] text-sm leading-relaxed mb-6">{std.desc}</p>
                <div className="flex items-center justify-between pt-4 border-t border-[#F5F7FA]">
                   <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">In the certified registry</span>
                </div>
             </div>
           ))}
        </div>

        <div className="space-y-8">
           <div className="bg-[#1F2937] p-8 text-white rounded-xl space-y-4 shadow-lg">
              <h4 className="font-oswald font-bold text-lg uppercase tracking-widest border-l-4 border-[#2563EB] pl-4">How references are checked</h4>
              <ul className="space-y-3 text-xs text-[#D1D5DB] leading-relaxed list-disc pl-4">
                 <li>The model is given these {AUTHENTICATED_STANDARDS.length} standards and asked to cite one of them.</li>
                 <li>The code then checks its answer. A code outside this list is not applied to the finding; it is shown as an unverified suggestion.</li>
                 <li>A reference typed by hand that is not on the list is saved but marked unverified, and reports leave it out.</li>
                 <li>Reports include supervisor-verified findings only, and flag any regulation the report text names that is not on this list.</li>
              </ul>
              <p className="text-[9px] font-mono text-[#9CA3AF] leading-relaxed uppercase pt-2">
                Coverage is limited to these standards. A hazard outside them has no registry citation.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
