
import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { useInspection } from '../context/InspectionContext';
import { generateFindingFromImage } from '../services/geminiService';
import { checkReference, enforceRegistry } from '../services/standardsGuard';
import { Button, Input, Textarea, Select, Badge } from '../components/ui';
import { 
  Upload, Sparkles, ChevronRight, Check, AlertTriangle, 
  Radio, ExternalLink, RotateCcw, PenTool, Bot, Loader2,
  ShieldCheck, Eye, Scale, Link as LinkIcon, Layers, ChevronUp, ChevronDown, ListFilter, Camera, Zap, Bookmark,
  Square, ArrowUpRight, Eraser, Undo2, Palette, Trash2, MousePointer2
} from 'lucide-react';
import { Category, Severity, ConfidenceLevel, RegulatoryStandard } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { LiveInspector } from '../components/LiveInspector';

type Tool = 'PEN' | 'BOX' | 'ARROW' | 'ERASER';
type AnnotationColor = '#DC2626' | '#D97706' | '#2563EB';

interface Point { x: number; y: number; }
interface Annotation {
  id: string;
  type: Tool;
  color: AnnotationColor;
  points: Point[];
}

const Workspace: React.FC = () => {
  const { currentInspection, addImageToInspection, saveFinding, updateFinding } = useInspection();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Initiating...');
  const [showLive, setShowLive] = useState(false);

  // Annotation State
  const [activeTool, setActiveTool] = useState<Tool>('PEN');
  const [activeColor, setActiveColor] = useState<AnnotationColor>('#2563EB');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[] | null>(null);
  const isDrawing = useRef(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');
  const [severity, setSeverity] = useState<string>('');
  const [action, setAction] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [regulatory, setRegulatory] = useState('');
  const [linkedStandards, setLinkedStandards] = useState<RegulatoryStandard[]>([]);
  const [aiUnverifiedRef, setAiUnverifiedRef] = useState('');
  const [visualConf, setVisualConf] = useState(0);
  const [regConf, setRegConf] = useState(0);
  const [confidence, setConfidence] = useState<ConfidenceLevel | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    if (editId && currentInspection) {
      const findingToEdit = currentInspection.findings.find(f => f.id === editId);
      if (findingToEdit) {
        setSelectedImageId(findingToEdit.imageId);
        populateForm(findingToEdit);
      }
    }
  }, [location.search, currentInspection?.id]);

  useEffect(() => {
    if (selectedImageId && currentInspection) {
      const existingFinding = currentInspection.findings.find(f => f.imageId === selectedImageId);
      if (existingFinding && !isEditing) {
        populateForm(existingFinding);
      } else if (!existingFinding && !isEditing) {
        resetForm();
      }
      setAnnotations([]); // Reset markings when changing images
    }
  }, [selectedImageId]);

  // Redraw Canvas on change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const drawAnnotation = (ann: Annotation | { type: Tool, color: AnnotationColor, points: Point[] }) => {
      if (ann.points.length < 2) return;
      ctx.strokeStyle = ann.color;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (ann.type === 'PEN') {
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        ann.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      } else if (ann.type === 'BOX') {
        const start = ann.points[0];
        const end = ann.points[ann.points.length - 1];
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (ann.type === 'ARROW') {
        const start = ann.points[0];
        const end = ann.points[ann.points.length - 1];
        const headlen = 20; 
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 6), end.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 6), end.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
    };

    annotations.forEach(drawAnnotation);
    if (currentStroke) {
      drawAnnotation({ type: activeTool, color: activeColor, points: currentStroke });
    }
  }, [annotations, currentStroke, activeTool, activeColor]);

  const populateForm = (finding: any) => {
    setTitle(finding.title);
    setDescription(finding.description);
    setCategory(finding.category);
    setSeverity(finding.severity);
    setAction(finding.recommendedAction);
    setRegulatory(finding.regulatoryReference || '');
    setLinkedStandards(finding.linkedStandards || []);
    setConfidence(finding.confidence);
    setVisualConf(finding.visualConfidence || 0);
    setRegConf(finding.regulatoryConfidence || 0);
    setEditingFindingId(finding.id);
    setIsEditing(true);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setSeverity('');
    setAction('');
    setUserNotes('');
    setRegulatory('');
    setAiUnverifiedRef('');
    setLinkedStandards([]);
    setVisualConf(0);
    setRegConf(0);
    setConfidence(undefined);
    setIsEditing(false);
    setEditingFindingId(null);
  };

  if (!currentInspection) {
    navigate('/');
    return null;
  }

  const selectedImage = currentInspection.images.find(img => img.id === selectedImageId);

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    const p = getCanvasPoint(e);
    setCurrentStroke([p]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const p = getCanvasPoint(e);
    if (activeTool === 'PEN') {
      setCurrentStroke(prev => prev ? [...prev, p] : [p]);
    } else {
      setCurrentStroke(prev => prev ? [prev[0], p] : [p]);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (currentStroke && currentStroke.length > 1) {
      setAnnotations(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        type: activeTool,
        color: activeColor,
        points: currentStroke
      }]);
    }
    setCurrentStroke(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setIsLoading(true);
      setLoadingStatus("Ingesting Media...");
      for (let i = 0; i < e.target.files.length; i++) {
        await addImageToInspection(e.target.files[i]);
      }
      setIsLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!selectedImage) return;
    
    setIsLoading(true);
    const statuses = ["Extracting Evidence...", "Merging Markups...", "Mapping Reference Tags...", "Finalizing Protocol..."];
    let statusIdx = 0;
    const statusInterval = setInterval(() => {
      setLoadingStatus(statuses[statusIdx % statuses.length]);
      statusIdx++;
    }, 1200);

    try {
      let imageToAnalyze = selectedImage.url;
      
      if (annotations.length > 0 && canvasRef.current) {
        const finalCanvas = document.createElement('canvas');
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = selectedImage.url;
        });
        
        finalCanvas.width = img.width;
        finalCanvas.height = img.height;
        const finalCtx = finalCanvas.getContext('2d');
        if (finalCtx) {
          finalCtx.drawImage(img, 0, 0);
          finalCtx.drawImage(canvasRef.current, 0, 0, finalCanvas.width, finalCanvas.height);
          imageToAnalyze = finalCanvas.toDataURL('image/jpeg', 0.8);
        }
      }

      const result = await generateFindingFromImage(imageToAnalyze, userNotes);
      setTitle(result.title);
      setDescription(result.description);
      setCategory(result.category);
      setSeverity(result.severity);
      setAction(result.recommendedAction);
      setRegulatory(result.regulatoryReference || '');
      setAiUnverifiedRef(result.unverifiedReference || '');
      setLinkedStandards(result.linkedStandards || []);
      setVisualConf(result.visualConfidence || 0);
      setRegConf(result.regulatoryConfidence || 0);
      setConfidence(result.confidence);
    } catch (error) {
      alert("Neural sync error. Retry execution.");
    } finally {
      clearInterval(statusInterval);
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!selectedImage || !title || !category || !severity) {
      alert("Complete required fields.");
      return;
    }

    // the reference is canonicalised if it is in the registry; anything else is saved as typed and
    // flagged as unregistered wherever it is shown, and never passed to the report
    const enforced = enforceRegistry({ regulatoryReference: regulatory, linkedStandards } as any);
    const payload = {
      imageId: selectedImage.id,
      imageUrl: selectedImage.url,
      title,
      description,
      category: category as Category,
      severity: severity as Severity,
      recommendedAction: action,
      regulatoryReference: enforced.regulatoryReference || regulatory.trim(),
      linkedStandards: enforced.linkedStandards || [],
      confidence,
      visualConfidence: visualConf,
      regulatoryConfidence: regConf
    };

    if (isEditing && editingFindingId) {
      const existing = currentInspection.findings.find(f => f.id === editingFindingId);
      updateFinding({ ...existing!, ...payload, timestamp: Date.now() }, "MANUAL_REVISION", "Updated finding metadata.");
    } else {
      saveFinding(payload);
    }
    resetForm();
  };

  const undo = () => setAnnotations(prev => prev.slice(0, -1));
  const clear = () => setAnnotations([]);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-[#F5F7FA]">
      
      {showLive && <LiveInspector onClose={() => setShowLive(false)} />}

      {/* Pane 1: Evidence Reel */}
      <nav className="shrink-0 bg-white border-r border-[#E5E7EB] flex flex-row md:flex-col h-24 md:h-full md:w-20 lg:w-72 overflow-x-auto md:overflow-y-auto z-40 custom-scrollbar shadow-sm">
        <div className="p-3 md:p-6 shrink-0 sticky left-0 top-0 bg-white z-50 border-r md:border-r-0 md:border-b border-[#E5E7EB] flex flex-row md:flex-col gap-3">
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center h-12 bg-[#EEF2F6] border border-[#E5E7EB] text-[#2563EB] hover:bg-white hover:border-[#2563EB] rounded-lg transition-all">
            <Upload className="w-5 h-5" />
          </button>
          <button onClick={() => setShowLive(true)} className="flex-1 flex items-center justify-center h-12 bg-red-50 border border-red-100 text-[#DC2626] hover:bg-red-600 hover:text-white rounded-lg transition-all">
            <Radio className="w-5 h-5 animate-pulse" />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
        </div>
        
        <div className="flex flex-row md:flex-col gap-4 p-4 min-w-0">
          {currentInspection.images.map(img => (
            <button 
              key={img.id} 
              onClick={() => { setSelectedImageId(img.id); setIsEditing(false); }} 
              className={`group cursor-pointer rounded-lg overflow-hidden relative shrink-0 w-16 h-16 md:w-full md:h-24 transition-all duration-200 border-4 ${selectedImageId === img.id ? 'border-[#2563EB] scale-95 shadow-lg' : 'border-transparent opacity-60 grayscale hover:opacity-100 hover:border-[#E5E7EB]'}`}
            >
              <img src={img.url} className="w-full h-full object-cover" alt="" />
              {currentInspection.findings.some(f => f.imageId === img.id) && (
                <div className="absolute top-1 right-1 bg-[#059669] text-white p-0.5 rounded shadow-md"><Check className="w-3 h-3" /></div>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Analysis Stage */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#EEF2F6] relative z-10 p-4 lg:p-10 overflow-hidden">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="bg-white/95 backdrop-blur-md px-4 py-2 border border-[#E5E7EB] rounded-lg flex items-center gap-3 shadow-sm">
            <Layers className="w-4 h-4 text-[#2563EB]" />
            <span className="text-[10px] font-bold text-[#4B5563] uppercase tracking-widest">{selectedImageId ? `SIGNAL::${selectedImageId.slice(0,8)}` : 'AWAIT_SIGNAL'}</span>
          </div>
          <Button variant="secondary" onClick={() => navigate('/findings')} className="h-10 bg-white/90 tracking-widest px-6 shadow-sm">
            MANIFEST ({currentInspection.findings.length}) <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="flex-1 relative flex items-center justify-center bg-white/30 rounded-2xl border border-white/50 shadow-inner overflow-hidden min-h-0">
           {selectedImage ? (
             <div className="relative shadow-2xl border border-[#E5E7EB] bg-white rounded-xl max-h-full max-w-full flex items-center justify-center overflow-hidden" ref={containerRef}>
                <img src={selectedImage.url} className="max-w-full max-h-[75vh] object-contain select-none" alt="Audit stage" draggable={false} />
                <canvas 
                  ref={canvasRef}
                  width={1024}
                  height={1024}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="absolute inset-0 w-full h-full cursor-crosshair touch-none z-20"
                />

                {/* Annotation Toolbar */}
                <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 bg-white/90 backdrop-blur-lg p-3 rounded-2xl shadow-2xl border border-white/20 z-40">
                   <ToolButton icon={<PenTool className="w-5 h-5" />} active={activeTool === 'PEN'} onClick={() => setActiveTool('PEN')} />
                   <ToolButton icon={<Square className="w-5 h-5" />} active={activeTool === 'BOX'} onClick={() => setActiveTool('BOX')} />
                   <ToolButton icon={<ArrowUpRight className="w-5 h-5" />} active={activeTool === 'ARROW'} onClick={() => setActiveTool('ARROW')} />
                   <div className="h-px bg-[#E5E7EB] mx-1 my-1" />
                   <ToolButton icon={<Palette className="w-5 h-5" style={{ color: activeColor }} />} active={false} onClick={() => {
                      const colors: AnnotationColor[] = ['#DC2626', '#D97706', '#2563EB'];
                      const idx = colors.indexOf(activeColor);
                      setActiveColor(colors[(idx + 1) % colors.length]);
                   }} />
                   <div className="h-px bg-[#E5E7EB] mx-1 my-1" />
                   <ToolButton icon={<Undo2 className="w-5 h-5" />} active={false} onClick={undo} />
                   <ToolButton icon={<Trash2 className="w-5 h-5 text-red-500" />} active={false} onClick={clear} />
                </div>

                <div className="absolute bottom-6 right-6 flex items-center gap-3 bg-[#1F2937] text-white px-4 py-2 rounded-xl shadow-2xl border border-white/10 z-40">
                   <MousePointer2 className="w-4 h-4 text-[#2563EB]" />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Tool: {activeTool}</span>
                </div>

                {isLoading && (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md animate-in fade-in">
                    <Loader2 className="w-12 h-12 text-[#2563EB] animate-spin mb-4" />
                    <div className="text-[#2563EB] font-oswald text-xl font-bold tracking-[0.2em] uppercase text-center">{loadingStatus}</div>
                  </div>
                )}
             </div>
           ) : (
             <div className="text-center flex flex-col items-center opacity-30">
                <Camera className="w-20 h-20 mb-6" />
                <h3 className="text-[#4B5563] font-oswald font-bold uppercase tracking-[0.4em] text-2xl">Signal Offline</h3>
                <p className="text-[#9CA3AF] text-[11px] font-bold uppercase mt-4">Select local evidence to begin synchronization</p>
             </div>
           )}
        </div>
      </main>

      {/* Pane 3: Logic Engine */}
      <aside className="shrink-0 w-full md:w-[450px] lg:w-[500px] bg-white border-l border-[#E5E7EB] flex flex-col h-full z-30 shadow-2xl relative">
          <header className="h-16 bg-[#EEF2F6] px-6 flex items-center justify-between border-b border-[#E5E7EB] shrink-0">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#2563EB]" />
              <h2 className="text-lg font-oswald font-bold text-[#1F2937] uppercase tracking-wide">Logic Engine</h2>
            </div>
            <button onClick={resetForm} className="p-2 text-[#9CA3AF] hover:text-[#2563EB]"><RotateCcw className="w-5 h-5" /></button>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-32">
            <div className="bg-[#1F2937] p-5 rounded-xl border border-white/10 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-bold text-[#2563EB] uppercase tracking-[0.3em] flex items-center gap-2"><Sparkles className="w-4 h-4" /> Neural Analysis</h3>
                <Badge color="blue">V3 Flash</Badge>
              </div>
              <Textarea placeholder="Contextual notes..." theme="dark" value={userNotes} onChange={(e) => setUserNotes(e.target.value)} className="mb-4 text-sm" />
              <Button onClick={handleGenerateAI} isLoading={isLoading} disabled={!selectedImage} className="w-full text-lg tracking-[0.2em] font-oswald py-5 shadow-lg bg-[#2563EB]">Execute Neural Audit</Button>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              <Input label="Finding Formal Title" value={title} onChange={e => setTitle(e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <Select label="Classification" value={category} onChange={e => setCategory(e.target.value)} options={Object.values(Category)} />
                <Select label="Priority" value={severity} onChange={e => setSeverity(e.target.value)} options={Object.values(Severity)} />
              </div>

              {(visualConf > 0 || regConf > 0) && (
                <div className="bg-[#F5F7FA] border border-[#E5E7EB] p-5 rounded-xl grid grid-cols-2 gap-8 shadow-inner">
                  <ConfidenceIndicator label="Visual" val={visualConf} />
                  <ConfidenceIndicator label="Legal Match" val={regConf} />
                </div>
              )}

              <Textarea label="Observation Log" value={description} onChange={e => setDescription(e.target.value)} rows={4} />
              
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-[#2563EB]" /> Certified Reference Tag
                </span>
                <div className="p-5 bg-gradient-to-r from-[#1F2937] to-[#111827] border-l-4 border-l-[#D97706] rounded-r-xl shadow-lg relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-2 opacity-5"><ShieldCheck className="w-12 h-12" /></div>
                   <div className="text-[9px] font-bold text-[#D97706] tracking-[0.2em] mb-1">LOCAL_CERTIFIED_MATCH</div>
                   <Input 
                    value={regulatory} 
                    onChange={e => setRegulatory(e.target.value)} 
                    placeholder="Ref Tag (e.g. 29 CFR 1926.651)" 
                    className="bg-transparent border-none text-white text-lg font-bold font-oswald uppercase p-0 focus:ring-0 placeholder-white/20"
                   />
                </div>
                <ReferenceStatusNote reference={regulatory} aiUnverified={aiUnverifiedRef} />
              </div>

              {linkedStandards.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Regulatory Map</span>
                  {linkedStandards.map((std, i) => (
                    <div key={i} className="flex flex-col p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-sm hover:border-[#2563EB] transition-all">
                       <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-bold text-[#2563EB]">{std.code}</span>
                          <a href={std.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5 text-[#9CA3AF] hover:text-[#2563EB]" /></a>
                       </div>
                       <div className="text-xs font-bold text-[#1F2937] leading-tight mb-2">{std.title}</div>
                       <p className="text-[10px] text-[#4B5563] leading-relaxed line-clamp-2">{std.description}</p>
                    </div>
                  ))}
                </div>
              )}

              <Textarea label="Mitigation Protocol" value={action} onChange={e => setAction(e.target.value)} rows={3} className="bg-[#F5F7FA] italic border-l-4 border-l-[#2563EB]" />

              <div className="fixed bottom-0 right-0 w-full md:w-[450px] lg:w-[500px] p-6 bg-white border-t border-[#E5E7EB] z-50">
                <Button onClick={handleSave} className="w-full py-6 text-xl tracking-[0.2em] font-oswald italic uppercase shadow-2xl" disabled={!selectedImage || !title}>Commit Record</Button>
              </div>
            </form>
          </div>
      </aside>
    </div>
  );
};

const ToolButton: React.FC<{ icon: React.ReactNode, active: boolean, onClick: () => void }> = ({ icon, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-xl transition-all duration-200 ${active ? 'bg-[#2563EB] text-white shadow-lg scale-110' : 'text-[#4B5563] hover:bg-[#EEF2F6] hover:text-[#2563EB]'}`}
  >
    {icon}
  </button>
);

const ConfidenceIndicator = ({ label, val }: { label: string, val: number }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[10px] font-bold uppercase">
      <span className="text-[#9CA3AF]">{label}</span> 
      <span className="text-[#2563EB]">{val}%</span>
    </div>
    <div className="h-1.5 bg-[#E5E7EB] w-full rounded-full overflow-hidden">
      <div className="h-full bg-[#2563EB]" style={{ width: `${val}%` }}></div>
    </div>
  </div>
);

export default Workspace;

// Says whether the reference is in the certified registry (services/standardsGuard.ts).
const ReferenceStatusNote: React.FC<{ reference: string; aiUnverified: string }> = ({ reference, aiUnverified }) => {
  const check = checkReference(reference);
  return (
    <div className="space-y-1">
      {check.status === 'REGISTRY' && (
        <p className="text-[10px] font-bold text-[#059669] uppercase tracking-widest">
          In certified registry: {check.standard!.title}
        </p>
      )}
      {check.status === 'UNREGISTERED' && (
        <p className="text-[10px] font-bold text-[#DC2626] uppercase tracking-widest">
          Not in the certified registry. Saved as unverified and left out of reports.
        </p>
      )}
      {aiUnverified && (
        <p className="text-[10px] font-bold text-[#D97706] uppercase tracking-widest">
          AI suggested "{aiUnverified}", which is not in the registry, so it was not applied.
        </p>
      )}
    </div>
  );
};
