
import React from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InspectionProvider } from './context/InspectionContext';
import Home from './pages/Home';
import Workspace from './pages/Workspace';
import FindingsList from './pages/FindingsList';
import ReportGenerator from './pages/ReportGenerator';
import EntryGate from './pages/EntryGate';
import Settings from './pages/Settings';
import KnowledgeBase from './pages/KnowledgeBase';
import { ComplianceChatFAB } from './components/ComplianceChatFAB';
import { Camera, LayoutDashboard, FileText, ClipboardList, LogOut, User as UserIcon, LockKeyhole, Settings as SettingsIcon, Database } from 'lucide-react';
import { UserRole } from './types';

const NavBar: React.FC = () => {
  const { user, projectKey, logout, clearProject } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path 
    ? "bg-white text-[#2563EB] shadow-md border-transparent" 
    : "text-white/80 hover:text-white hover:bg-white/10 border-transparent";
  
  const linkClass = "flex items-center gap-2 px-5 h-10 text-[11px] font-bold uppercase tracking-widest transition-all duration-200 rounded-lg border-2";

  return (
    <nav className="h-16 bg-[#2563EB] border-b border-[#1D4ED8] sticky top-0 z-[100] shadow-xl">
      <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-white p-2 rounded-lg shadow-sm group-hover:scale-105 transition-transform">
            <Camera className="w-5 h-5 text-[#2563EB]" />
          </div>
          <div className="flex flex-col">
            <span className="font-oswald font-bold text-2xl tracking-tight text-white italic leading-none">
              SNAP<span className="text-white/50">INSPECT</span>.AI
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 h-full">
          {projectKey && (
            <div className="flex h-full items-center gap-2 mr-6 border-r border-white/20 pr-6">
              <Link to="/workspace" className={`${linkClass} ${isActive('/workspace')}`}>
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden xl:inline">Workspace</span>
              </Link>
              <Link to="/findings" className={`${linkClass} ${isActive('/findings')}`}>
                <ClipboardList className="w-4 h-4" />
                <span className="hidden xl:inline">Findings</span>
              </Link>
              <Link to="/kb" className={`${linkClass} ${isActive('/kb')}`}>
                <Database className="w-4 h-4" />
                <span className="hidden xl:inline">Library</span>
              </Link>
              <Link to="/report" className={`${linkClass} ${isActive('/report')}`}>
                <FileText className="w-4 h-4" />
                <span className="hidden xl:inline">Report</span>
              </Link>
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 h-10 px-4 bg-white/10 rounded-lg border border-white/20">
               <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center border border-[#1D4ED8] overflow-hidden shadow-inner">
                 {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 text-[#2563EB]" />}
               </div>
               <div className="flex flex-col">
                 <span className="text-[10px] text-white font-bold uppercase truncate max-w-[120px] tracking-wider leading-none">{user?.name}</span>
               </div>
            </div>

            <div className="flex items-center gap-1">
              {(user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERVISOR) && (
                <Link to="/settings" className={`p-2.5 text-white/60 hover:text-white transition-colors ${location.pathname === '/settings' ? 'text-white' : ''}`} title="System Configuration">
                  <SettingsIcon className="w-5 h-5" />
                </Link>
              )}
              <button onClick={logout} className="p-2.5 text-white/60 hover:text-red-300 transition-colors" title="Secure Exit">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const AppContent: React.FC = () => {
  const { user, projectKey } = useAuth();

  if (!user) return <EntryGate />;

  return (
    <InspectionProvider accessCode={projectKey || 'UNAUTHORIZED'} key={projectKey}>
      <HashRouter>
        <div className="min-h-screen bg-[#F5F7FA] font-sans text-[#1F2937] flex flex-col relative">
          <NavBar />
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/workspace" element={<Workspace />} />
              <Route path="/findings" element={<FindingsList />} />
              <Route path="/report" element={<ReportGenerator />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/kb" element={<KnowledgeBase />} />
            </Routes>
          </div>
          <ComplianceChatFAB />
        </div>
      </HashRouter>
    </InspectionProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
