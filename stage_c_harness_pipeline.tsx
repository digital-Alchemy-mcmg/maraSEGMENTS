import React, { useState, useEffect } from 'react';
import { 
  Play, FastForward, RotateCcw, AlertTriangle, CheckCircle, 
  Lock, FileText, Share2, Layers, ShieldCheck, Printer
} from 'lucide-react';

const INITIAL_ENVELOPE = {
  id: "B5-ENV-8492-X",
  source: "B5_Projection",
  target_opportunity: "Principal Frontend Architect",
  semantic_fields: [
    { field: "Architecture", weight: 0.95, evidence_id: "SDNA-77A" },
    { field: "Systems Engineering", weight: 0.88, evidence_id: "SDNA-92B" },
    { field: "UI Performance", weight: 0.91, evidence_id: "SDNA-14C" }
  ],
  pipeline_lineage: []
};

const INVARIANTS = [
  "Zero new evidence created in C1–C5",
  "All claims remain traceable to B5",
  "Semantic meaning locked at C1",
  "Defined stage boundaries",
  "Conventional resume writing restricted",
  "Failure routing preserves semantics"
];

export default function StageCHarness() {
  const [currentStage, setCurrentStage] = useState(0); // 0=Idle, 1=C1, 2=C2, 3=C3, 4=C4, 5=C5
  const [envelope, setEnvelope] = useState(INITIAL_ENVELOPE);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [simulateRework, setSimulateRework] = useState(false);
  const [reworkRoute, setReworkRoute] = useState(null);

  const processStage = (targetStage) => {
    if (targetStage === 1) {
      setEnvelope(prev => ({
        ...prev,
        c1_resolution: {
          status: "LOCKED",
          prominence_classes: { primary: ["Architecture"], supporting: ["Systems Engineering", "UI Performance"] },
          evidence_boundaries: ["SDNA-77A", "SDNA-92B", "SDNA-14C"],
          module: "c1_docket.py" 
        },
        pipeline_lineage: [...prev.pipeline_lineage, "C1_RESOLVED"]
      }));
    } else if (targetStage === 2) {
      setEnvelope(prev => ({
        ...prev,
        c2_expressions: {
          status: "BOUNDED",
          statements: [
            "Architected frontend systems leveraging SDNA-77A.",
            "Engineered performant UI layers mapped to SDNA-14C."
          ],
          module: "c2_claims.py"
        },
        pipeline_lineage: [...prev.pipeline_lineage, "C2_EXPRESSED"]
      }));
    } else if (targetStage === 3) {
      setEnvelope(prev => ({
        ...prev,
        c3_layout: {
          status: "PROJECTED",
          document_structure: {
            page_limit: 1,
            total_lines: 42,
            sections: ["Core Competencies", "Technical Evidence"]
          },
          module: "c3_model.py"
        },
        pipeline_lineage: [...prev.pipeline_lineage, "C3_MAPPED"]
      }));
    } else if (targetStage === 4) {
      if (simulateRework) {
        setReworkRoute('C2'); // Simulating an expression ceiling issue routing back to C2
        setIsAutoRunning(false);
        return false;
      }
      setEnvelope(prev => ({
        ...prev,
        c4_validation: {
          status: "AUDIT_PASS",
          integrity_check: "VERIFIED",
          traceability: "VERIFIED",
          layout_implications: "VERIFIED",
          module: "c4_layout.py"
        },
        pipeline_lineage: [...prev.pipeline_lineage, "C4_VALIDATED"]
      }));
    } else if (targetStage === 5) {
      setEnvelope(prev => ({
        ...prev,
        c5_artifact: {
          status: "RENDERED",
          provenance_lock: {
            hash: "sha256:8f43b2c19e5d42c8...e7a1",
            timestamp: new Date().toISOString(),
            signature: "VALID"
          },
          module: "c5_artifact.py"
        },
        pipeline_lineage: [...prev.pipeline_lineage, "C5_LOCKED"]
      }));
    }
    return true;
  };

  const handleStep = () => {
    if (currentStage >= 5 || reworkRoute) return;
    const nextStage = currentStage + 1;
    const success = processStage(nextStage);
    if (success) setCurrentStage(nextStage);
  };

  const handleReset = () => {
    setCurrentStage(0);
    setEnvelope(INITIAL_ENVELOPE);
    setIsAutoRunning(false);
    setReworkRoute(null);
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    let timer;
    if (isAutoRunning && currentStage < 5 && !reworkRoute) {
      timer = window.setTimeout(() => {
        handleStep();
      }, 1200);
    } else if (currentStage >= 5 || reworkRoute) {
      setIsAutoRunning(false);
    }
    return () => clearTimeout(timer);
  }, [isAutoRunning, currentStage, reworkRoute]);

  const EngineCard = ({ num, title, icon: Icon, active, complete, error }) => (
    <div className={`flex-1 p-3 rounded-lg border-2 transition-all duration-300 ${
      error ? 'border-amber-500 bg-amber-950/30' :
      active ? 'border-cyan-500 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 
      complete ? 'border-emerald-700 bg-emerald-950/10' : 
      'border-slate-800 bg-slate-900/50'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2 rounded-md ${
          error ? 'bg-amber-500/20 text-amber-400' :
          active ? 'bg-cyan-500/20 text-cyan-400' : 
          complete ? 'bg-emerald-500/20 text-emerald-400' : 
          'bg-slate-800 text-slate-500'
        }`}>
          <Icon size={20} />
        </div>
        <div className="text-xs font-mono text-slate-500">C{num}</div>
      </div>
      <h3 className={`text-sm font-bold ${active || complete ? 'text-slate-200' : 'text-slate-500'}`}>{title}</h3>
      <div className="mt-4 text-xs font-mono">
        {error ? (
           <span className="text-amber-400 flex items-center gap-1"><AlertTriangle size={12}/> REWORK ROUTED</span>
        ) : complete ? (
          <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={12}/> PASS</span>
        ) : active ? (
          <span className="text-cyan-400 animate-pulse">PROCESSING...</span>
        ) : (
          <span className="text-slate-600">IDLE</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-300 font-sans overflow-hidden">
      {/* Header & Controls */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="text-cyan-500" />
            STAGE_C_HARNESS // Resume Factory Pipeline
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-1">Executing run_stage_c.py - B5 Projection to Rendered Artifact</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-mono text-amber-400/80 cursor-pointer hover:text-amber-300 transition-colors">
            <input 
              type="checkbox" 
              checked={simulateRework} 
              onChange={(e) => setSimulateRework(e.target.checked)}
              className="accent-amber-500"
            />
            Simulate C4 Failure
          </label>
          <div className="h-6 w-px bg-slate-700"></div>
          <button 
            onClick={handleStep} 
            disabled={currentStage >= 5 || isAutoRunning || reworkRoute !== null}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-sm font-medium rounded border border-slate-700 transition-colors"
          >
            <Play size={16} /> Step Engine
          </button>
          <button 
            onClick={() => setIsAutoRunning(true)} 
            disabled={currentStage >= 5 || isAutoRunning || reworkRoute !== null}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-900/50 hover:bg-cyan-800/60 disabled:opacity-50 text-cyan-100 text-sm font-medium rounded border border-cyan-800 transition-colors"
          >
            <FastForward size={16} /> Run Pipeline
          </button>
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded border border-slate-700 transition-colors"
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </header>

      { }
      {/* 5-Column Engine Layout */}
      <section className="px-6 py-6 border-b border-slate-800 bg-slate-900/30">
        <div className="flex gap-4 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -z-10"></div>
          
          <EngineCard num="1" title="Resolution Engine" icon={Share2} active={currentStage === 1} complete={currentStage > 1} />
          <EngineCard num="2" title="Expression & Composition" icon={FileText} active={currentStage === 2} complete={currentStage > 2} error={reworkRoute === 'C2'} />
          <EngineCard num="3" title="Layout Projection" icon={Layers} active={currentStage === 3} complete={currentStage > 3} />
          <EngineCard num="4" title="Validation & Rework" icon={ShieldCheck} active={currentStage === 4} complete={currentStage > 4} error={reworkRoute !== null} />
          <EngineCard num="5" title="Render & Provenance" icon={Lock} active={currentStage === 5} complete={currentStage === 5} />
        </div>

        {/* Rework Routing Indicator */}
        {reworkRoute && (
          <div className="mt-6 p-4 border border-amber-700/50 bg-amber-950/20 rounded shadow-[0_0_20px_rgba(217,119,6,0.15)] text-amber-400 font-mono text-sm flex items-center justify-between">
            <span className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={18} /> C4 AUDIT FAILED: Expression Ceiling Violation Detected.
            </span>
            <span className="bg-amber-900/40 px-3 py-1 rounded border border-amber-700/50">
              Rework Typed Route: <strong className="text-amber-300">C4 → {reworkRoute}</strong>
            </span>
          </div>
        )}
      </section>

      { }
      {/* Workspace Area */}
      <section className="flex-1 flex overflow-hidden">
        {/* Live JSON Inspector */}
        <div className="w-1/2 border-r border-slate-800 flex flex-col bg-[#0d1117]">
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400 flex justify-between uppercase tracking-wider">
            <span>Envelope.json (Live State)</span>
            <span className={currentStage === 0 ? 'text-slate-500' : 'text-emerald-500'}>
              {currentStage === 0 ? 'Awaiting Ingress' : 'Syncing...'}
            </span>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <pre className="text-[13px] font-mono text-emerald-400/80 leading-relaxed">
              {JSON.stringify(envelope, null, 2)}
            </pre>
          </div>
        </div>

        {/* Live Rendered Artifact */}
        <div className="w-1/2 flex flex-col bg-slate-900/50">
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400 flex justify-between items-center uppercase tracking-wider">
            <span>Preview Artifact.html</span>
            {currentStage === 5 && (
              <button onClick={handlePrint} className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors bg-slate-800 px-2 py-1 rounded">
                <Printer size={14}/> Print PDF
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto p-8 flex justify-center items-start bg-slate-800/30 relative">
            {currentStage < 3 ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-600 font-mono text-sm gap-4">
                 <Layers size={48} className="opacity-20"/>
                 Awaiting C3 Layout Projection...
               </div>
            ) : (
              <div className="bg-white text-slate-900 w-full max-w-xl min-h-[600px] shadow-2xl p-10 relative font-serif text-sm transition-all duration-500 print:shadow-none print:p-0">
                {currentStage === 5 && (
                  <div className="absolute top-0 right-0 m-6 text-[10px] text-slate-400 font-mono text-right flex flex-col items-end print:hidden">
                    <Lock size={12} className="text-emerald-600 mb-1" />
                    PROVENANCE SECURED<br/>
                    {envelope.c5_artifact?.provenance_lock.hash.substring(0,24)}...
                  </div>
                )}
                
                <header className="border-b-2 border-slate-900 pb-4 mb-6">
                  <h1 className="text-3xl font-bold uppercase tracking-widest">{INITIAL_ENVELOPE.target_opportunity}</h1>
                  <p className="text-slate-600 font-sans text-xs mt-2 font-semibold">B5_PROJECTION • TRACEABLE EVIDENCE LOCKED</p>
                </header>
                
                <main className={currentStage < 4 ? 'opacity-40 blur-[1px] select-none' : 'opacity-100 transition-all duration-700'}>
                  <section className="mb-8">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 font-sans">Resolved Semantics (C1)</h2>
                    <ul className="list-disc pl-6 space-y-1.5 text-slate-800">
                      {envelope.c1_resolution?.prominence_classes.primary.map((item, i) => <li key={i}><strong>{item}</strong> (Primary)</li>)}
                      {envelope.c1_resolution?.prominence_classes.supporting.map((item, i) => <li key={i}>{item} (Supporting)</li>)}
                    </ul>
                  </section>
                  
                  <section>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 font-sans">Bounded Expressions (C2)</h2>
                    <div className="space-y-4">
                      {envelope.c2_expressions?.statements.map((stmt, i) => (
                        <p key={i} className="leading-relaxed border-l-4 border-slate-300 pl-4 text-slate-800">{stmt}</p>
                      ))}
                    </div>
                  </section>
                </main>

                {currentStage < 5 && (
                  <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center backdrop-blur-[2px] print:hidden">
                    <div className="bg-slate-900 text-white px-6 py-3 rounded font-mono text-sm font-bold border border-slate-700 shadow-xl flex items-center gap-3">
                      <div className="h-2 w-2 bg-cyan-400 rounded-full animate-ping"></div>
                      {currentStage === 3 ? 'C3 PROJECTED - AWAITING C4 AUDIT' : 'C4 AUDITED - AWAITING C5 LOCK'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      { }
      {/* Global Invariants Footer */}
      <footer className="bg-slate-950 border-t border-emerald-900/30 p-2.5 overflow-x-auto flex items-center gap-6 whitespace-nowrap scrollbar-hide">
        <span className="text-emerald-500 font-bold text-xs uppercase tracking-widest flex-shrink-0 flex items-center gap-2 ml-4">
          <ShieldCheck size={16}/>
          Global Invariants Active
        </span>
        <div className="flex gap-4">
          {INVARIANTS.map((inv, idx) => (
            <div key={idx} className="text-[11px] font-mono text-emerald-400/70 bg-emerald-950/20 px-3 py-1.5 rounded border border-emerald-900/30 flex-shrink-0 shadow-inner">
              {inv}
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}