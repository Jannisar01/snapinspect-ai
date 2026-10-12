
import React, { useState, useEffect, useRef } from 'react';
import { useInspection } from '../context/InspectionContext';
import { generateReportFromFindings, generateReportAudio, decode, decodeAudioData } from '../services/geminiService';
import { Button, Input } from '../components/ui';
import { ArrowLeft, FileText, Download, Volume2, Loader2, Pause, ShieldCheck, FileCog, History, ChevronRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from "jspdf";
import ReactMarkdown from "react-markdown";
import { findUnregisteredCitations, selectReportFindings } from "../services/standardsGuard";

const ReportGenerator: React.FC = () => {
  const { currentInspection, saveInspectionReport, updateInspectionMetadata } = useInspection();
  const navigate = useNavigate();
  const [reportText, setReportText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  
  const audioContext = useRef<AudioContext | null>(null);
  const currentSource = useRef<AudioBufferSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  useEffect(() => {
    if (currentInspection?.reportContent) {
      setReportText(currentInspection.reportContent);
    }
  }, [currentInspection?.id]);

  if (!currentInspection) {
    navigate('/');
    return null;
  }

  const { included, excludedDrafts } = selectReportFindings(currentInspection);
  const strayCitations = reportText ? findUnregisteredCitations(reportText) : [];

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const text = await generateReportFromFindings(currentInspection);
      setReportText(text);
      saveInspectionReport(text);
    } catch (e) {
      alert("Error generating report.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleListen = async () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContext.current.state === 'suspended') await audioContext.current.resume();

    if (isPlaying) {
      if (currentSource.current) try { currentSource.current.stop(); } catch(e) {}
      setIsPlaying(false);
      return;
    }

    setIsAudioLoading(true);
    try {
      const base64Audio = await generateReportAudio(reportText);
      const buffer = await decodeAudioData(decode(base64Audio), audioContext.current, 24000, 1);
      const source = audioContext.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.current.destination);
      source.onended = () => setIsPlaying(false);
      currentSource.current = source;
      source.start(0);
      setIsPlaying(true);
    } catch (e) {
      alert("Failed to generate audio summary.");
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (strayCitations.length > 0 && !window.confirm(`The report names ${strayCitations.join(', ')}, not in the certified registry. Export anyway?`)) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxLineWidth = pageWidth - (margin * 2);

    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text("OFFICIAL SAFETY INSPECTION REPORT", pageWidth / 2, margin + 5, { align: "center" });
    
    doc.setFontSize(9);
    doc.text(`ENTITY: ${(currentInspection.companyName || 'N/A').toUpperCase()}`, margin, margin + 20);
    doc.text(`VERSION: V${currentInspection.reportHistory.length}`, pageWidth - margin, margin + 20, { align: "right" });
    doc.text(`SITE: ${currentInspection.name.toUpperCase()}`, margin, margin + 27);
    doc.text(`DATE: ${currentInspection.inspectionDate || new Date().toISOString().split('T')[0]}`, pageWidth - margin, margin + 27, { align: "right" });

    doc.setLineWidth(0.4);
    doc.line(margin, margin + 34, pageWidth - margin, margin + 34);

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    let yPos = margin + 50;
    
    const splitLines = doc.splitTextToSize(reportText, maxLineWidth);
    splitLines.forEach((line: string) => {
      if (yPos > pageHeight - margin - 15) {
        doc.setFontSize(8);
        doc.text("CONFIDENTIAL - SECURE VERSIONED DOCUMENT", pageWidth / 2, pageHeight - 10, { align: "center" });
        doc.addPage();
        yPos = margin + 15;
        doc.setFontSize(10);
      }
      doc.text(line, margin, yPos);
      yPos += 6;
    });

    doc.save(`Report_V${currentInspection.reportHistory.length}_${currentInspection.reportId}.pdf`);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row bg-zinc-200 overflow-hidden">
      <div className="w-full md:w-80 bg-zinc-100 border-r-2 border-zinc-300 flex flex-col p-6 overflow-y-auto shrink-0 z-10 shadow-lg">
        <Button variant="ghost" onClick={() => navigate('/findings')} className="mb-6 self-start pl-0 hover:text-orange-600 font-bold uppercase text-xs">
           <ArrowLeft className="w-4 h-4 mr-2" /> RETURN
        </Button>
        
        <h2 className="text-2xl font-oswald font-bold mb-6 text-zinc-800 uppercase border-b-2 border-zinc-200 pb-2">Compliance Hub</h2>
        
        <div className="space-y-4 mb-8">
          <Input label="Entity" value={currentInspection.companyName || ''} onChange={(e) => updateInspectionMetadata({ companyName: e.target.value })} />
          <Input label="Reference ID" value={currentInspection.reportId || ''} onChange={(e) => updateInspectionMetadata({ reportId: e.target.value })} />
          <Input label="Lead Inspector" value={currentInspection.inspectingOfficer || ''} onChange={(e) => updateInspectionMetadata({ inspectingOfficer: e.target.value })} />
        </div>

        <div className="mb-8 p-4 bg-zinc-800 rounded-sm">
           <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Version Control</span>
              <button onClick={() => setShowVersions(!showVersions)} className="text-white hover:text-orange-500 transition-colors">
                 <History className="w-4 h-4" />
              </button>
           </div>
           <div className="space-y-2">
              <div className="text-[9px] text-zinc-400 font-mono flex justify-between">
                 <span>CURRENT REVISION</span>
                 <span className="text-white">V{currentInspection.reportHistory.length}</span>
              </div>
              <div className="text-[9px] text-zinc-400 font-mono flex justify-between">
                 <span>SNAP_TIMESTAMP</span>
                 <span className="text-white">{currentInspection.reportHistory.length > 0 ? new Date(currentInspection.reportHistory[currentInspection.reportHistory.length-1].timestamp).toLocaleDateString() : 'N/A'}</span>
              </div>
           </div>
        </div>

        <div className="mb-6 p-4 bg-white border-2 border-zinc-300 rounded-sm space-y-1 text-[10px] font-bold uppercase tracking-widest">
           <div className="text-emerald-700">{included.length} verified finding{included.length === 1 ? '' : 's'} included</div>
           {excludedDrafts.length > 0 && (
             <div className="text-orange-600">{excludedDrafts.length} AI draft{excludedDrafts.length === 1 ? '' : 's'} left out until a supervisor verifies {excludedDrafts.length === 1 ? 'it' : 'them'}</div>
           )}
        </div>

        <div className="mt-auto space-y-3">
             <Button onClick={handleGenerate} isLoading={isLoading} disabled={included.length === 0} className="w-full py-4 font-bold bg-zinc-900 border-b-4 border-orange-600">
                <FileCog className="w-5 h-5 mr-2" /> {reportText ? 'UPDATE REVISION' : 'INITIAL DRAFT'}
            </Button>
            {reportText && (
               <Button onClick={handleListen} variant="secondary" className={`w-full py-4 ${isPlaying ? 'border-orange-500 text-orange-600' : ''}`} disabled={isAudioLoading}>
                {isAudioLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Volume2 className="w-5 h-5 mr-2" />}
                DEBRIEF
              </Button>
            )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
        <div className="h-16 bg-zinc-800 border-b-4 border-emerald-600 flex items-center justify-between px-8 shrink-0 z-10 shadow-md">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" /> ENTERPRISE_HARDENED_DOC
          </h2>
          <Button variant="primary" onClick={handleExportPDF} disabled={!reportText} className="bg-emerald-600 hover:bg-emerald-700 font-oswald tracking-widest px-8">
             <Download className="w-4 h-4 mr-2" /> EXPORT FINAL
          </Button>
        </div>

        <div className="flex-1 p-4 md:p-10 bg-zinc-300 overflow-y-auto">
           {showVersions && (
             <div className="max-w-2xl mx-auto mb-10 bg-zinc-900 p-8 border-l-4 border-orange-500 shadow-2xl animate-in slide-in-from-top-4">
                <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                   <h3 className="text-orange-500 font-bold uppercase tracking-widest text-xs">Report Snapshot History</h3>
                   <button onClick={() => setShowVersions(false)} className="text-zinc-500 hover:text-white uppercase text-[10px] font-bold">[ Close History ]</button>
                </div>
                <div className="space-y-4">
                   {currentInspection.reportHistory.length === 0 ? (
                     <p className="text-zinc-600 text-[10px] uppercase font-mono italic">No previous versions detected in this node.</p>
                   ) : (
                     currentInspection.reportHistory.slice().reverse().map((snap) => (
                       <div key={snap.id} className="group flex items-center justify-between p-3 bg-zinc-800/50 hover:bg-zinc-800 transition-colors border border-zinc-700/50">
                          <div className="flex items-center gap-4">
                             <div className="text-xl font-oswald font-bold text-zinc-600 group-hover:text-orange-500">V{snap.version}</div>
                             <div>
                                <div className="text-[10px] text-zinc-300 font-bold uppercase">ID: {snap.metadata.reportId}</div>
                                <div className="text-[9px] text-zinc-500 font-mono uppercase">{new Date(snap.timestamp).toLocaleString()}</div>
                             </div>
                          </div>
                          <button onClick={() => setReportText(snap.content)} className="text-zinc-500 hover:text-orange-500 p-2"><ChevronRight className="w-5 h-5" /></button>
                       </div>
                     ))
                   )}
                </div>
             </div>
           )}

           <div className="max-w-[210mm] mx-auto bg-white min-h-[297mm] shadow-2xl p-16 md:p-20 border border-zinc-300 flex flex-col relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none">
                <FileText className="w-64 h-64 -rotate-12" />
             </div>
             
             <div className="mb-10 text-zinc-950 z-10" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                <h1 className="text-2xl font-bold uppercase text-center mb-10 tracking-tight">OFFICIAL SAFETY INSPECTION REPORT</h1>
                <div className="grid grid-cols-2 gap-y-3 text-[11px] font-bold uppercase tracking-tight">
                   <div>ENTITY: {currentInspection.companyName || 'N/A'}</div>
                   <div className="text-right">VERSION: V{currentInspection.reportHistory.length}</div>
                   <div>SITE: {currentInspection.name}</div>
                   <div className="text-right">DATE: {currentInspection.inspectionDate || new Date().toISOString().split('T')[0]}</div>
                </div>
                <div className="border-b border-zinc-950 mt-6 mb-1.5"></div>
             </div>

             {strayCitations.length > 0 && (
               <div className="mb-6 p-3 border-2 border-red-600 bg-red-50 text-red-700 text-[11px] font-bold z-10">
                 This report names {strayCitations.join(', ')}, which {strayCitations.length === 1 ? 'is' : 'are'} not in the certified registry. Remove or check {strayCitations.length === 1 ? 'it' : 'them'} before export.
               </div>
             )}

             {reportText ? (
               <div className="prose prose-sm prose-zinc max-w-none text-zinc-900 leading-relaxed text-[13px] flex-1 z-10" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                 <ReactMarkdown>{reportText}</ReactMarkdown>
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-zinc-300 border-4 border-dashed border-zinc-100">
                 <p className="uppercase font-bold tracking-[0.3em] text-zinc-400 text-sm">Awaiting Draft Compilation</p>
               </div>
             )}
             
             <div className="mt-12 pt-6 border-t border-zinc-200 text-[10px] text-zinc-500 uppercase font-bold italic text-center z-10" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                CONFIDENTIAL - SECURE VERSIONED DOCUMENT - SYSTEM_V2
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
