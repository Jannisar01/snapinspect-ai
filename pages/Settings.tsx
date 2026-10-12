
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input } from '../components/ui';
import { ShieldCheck, User, Building, Database, Zap, ArrowLeft, Lock, Globe, HardDrive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const { user, projectKey } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
      <div className="flex flex-col gap-4">
         <button 
           onClick={() => navigate('/')} 
           className="text-[#4B5563] hover:text-[#2563EB] flex items-center text-[10px] font-bold uppercase tracking-[0.3em] transition-all"
          >
          <ArrowLeft className="w-4 h-4 mr-2" /> [ Return to Dashboard ]
        </button>
        <h1 className="text-4xl font-oswald font-bold text-[#1F2937] uppercase italic tracking-tighter">System Configuration</h1>
      </div>

      <div className="grid gap-8">
         <Card title="Inspector Credentials">
            <div className="flex items-center gap-6 p-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl">
               <div className="w-16 h-16 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-lg">
                  <User className="w-8 h-8 text-white" />
               </div>
               <div className="flex-1 grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[9px] text-[#9CA3AF] font-bold uppercase tracking-widest mb-1">Authenticated UID</div>
                    <div className="font-mono text-xs font-bold text-[#1F2937]">{user?.id}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#9CA3AF] font-bold uppercase tracking-widest mb-1">Permission Level</div>
                    <div className="font-mono text-xs font-bold text-[#2563EB] uppercase">{user?.role}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#9CA3AF] font-bold uppercase tracking-widest mb-1">Officer Name</div>
                    <div className="font-bold text-[#1F2937]">{user?.name}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#9CA3AF] font-bold uppercase tracking-widest mb-1">Node Domain</div>
                    <div className="font-bold text-[#4B5563] uppercase">{user?.provider} :: {user?.orgId}</div>
                  </div>
               </div>
            </div>
         </Card>

         <Card title="Neural Pipeline Status">
            <div className="space-y-4">
               <div className="flex items-center justify-between p-5 bg-[#1F2937] text-white rounded-xl shadow-md">
                  <div className="flex items-center gap-3">
                     <Zap className="w-5 h-5 text-[#2563EB]" />
                     <span className="text-xs font-bold uppercase tracking-widest">Inference Engine</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#059669] bg-[#059669]/10 px-3 py-1 border border-[#059669]/30 rounded">STABLE_V4</span>
               </div>
               
               <div className="flex items-center justify-between p-5 bg-white border border-[#E5E7EB] rounded-xl">
                  <div className="flex items-center gap-3">
                     <HardDrive className="w-5 h-5 text-[#9CA3AF]" />
                     <span className="text-xs font-bold uppercase tracking-widest">Storage Cache</span>
                  </div>
                  <div className="w-32 h-1.5 bg-[#EEF2F6] rounded-full overflow-hidden">
                     <div className="h-full bg-[#2563EB] w-1/4"></div>
                  </div>
                  <span className="text-[9px] font-mono text-[#9CA3AF] uppercase">1.2GB / 5.0GB</span>
               </div>
            </div>
         </Card>

         <div className="bg-[#EEF2F6] p-8 border border-[#E5E7EB] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
               <div className="p-4 bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
                  <Lock className="w-7 h-7 text-[#4B5563]" />
               </div>
               <div>
                  <h3 className="text-xl font-oswald font-bold text-[#1F2937] uppercase italic">Site Access Lock</h3>
                  <p className="text-xs text-[#4B5563] max-w-sm font-medium leading-relaxed">Revoking the current site token will return you to the dashboard and encrypt active manifests.</p>
               </div>
            </div>
            <Button variant="danger" onClick={() => navigate('/')} className="px-10 h-14 font-bold uppercase tracking-widest shadow-lg">
               REVOKE_ACCESS
            </Button>
         </div>
      </div>

      <div className="text-center pt-10">
         <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-[0.4em]">SnapInspect AI v3.0.1-STABLE | © Enterprise Compliance</p>
      </div>
    </div>
  );
};

export default Settings;
