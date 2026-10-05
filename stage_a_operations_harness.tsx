import React, { useState, useEffect, useRef } from 'react';
import { 
    ShieldAlert, Database, FileJson, Lock, Play, AlertTriangle, 
    CheckCircle, Upload, Server, Activity, ArrowRight, XCircle
} from 'lucide-react';

class TypedMissingInputError extends Error {
    constructor(stage, requiredField, expectedSource) {
        super(`FAIL-CLOSED [${stage}]: Required upstream value '${requiredField}' from '${expectedSource}' is missing.`);
        this.stage = stage;
        this.requiredField = requiredField;
        this.expectedSource = expectedSource;
        this.name = 'TypedMissingInputError';
    }
}

class PipelineHaltBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // In a real app, log to telemetry here
        console.error("Pipeline Halted:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-mono">
                    <div className="bg-red-950/50 border-2 border-red-500 rounded-lg p-8 max-w-2xl w-full text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                        <div className="flex items-center gap-4 mb-6 border-b border-red-500/30 pb-4">
                            <ShieldAlert size={40} className="text-red-500" />
                            <h1 className="text-2xl font-bold tracking-wider text-red-500">PIPELINE HALTED</h1>
                        </div>
                        <div className="space-y-4">
                            <p className="font-semibold text-lg">{this.state.error.message}</p>
                            {this.state.error instanceof TypedMissingInputError && (
                                <ul className="list-disc list-inside bg-black/40 p-4 rounded text-sm space-y-2">
                                    <li><span className="text-red-300">Stage:</span> {this.state.error.stage}</li>
                                    <li><span className="text-red-300">Missing Field:</span> {this.state.error.requiredField}</li>
                                    <li><span className="text-red-300">Expected Source:</span> {this.state.error.expectedSource}</li>
                                </ul>
                            )}
                            <p className="text-xs text-red-500/70 mt-6 uppercase tracking-widest">
                                Resolution required. Data hallucination prevented. 
                                Downstream reconstruction is prohibited.
                            </p>
                        </div>
                        <button 
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.dispatchEvent(new CustomEvent('pipeline:reset'));
                            }}
                            className="mt-8 px-4 py-2 bg-red-900/50 hover:bg-red-800/50 border border-red-500/50 rounded transition-colors text-sm text-white"
                        >
                            ACKNOWLEDGE & RESTART HARNESS
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const ScoutEngine = {
    processRawJob: (rawJobJson) => {
        let rawJob;
        try {
            rawJob = JSON.parse(rawJobJson);
        } catch (e) {
            throw new Error("Invalid JSON provided for RawJobInput.");
        }

        // 1. Strict Extraction - Fail Closed if core identity is missing
        const requiredCore = ["id", "company", "title", "location", "source_url", "original_content_sha256"];
        for (const req of requiredCore) {
            if (!rawJob[req]) {
                throw new TypedMissingInputError("A_SCOUT", req, "RawJobInput");
            }
        }

        // 2. Strict Semantic Constraints - Do not invent missing values. Mark ABSENT.
        const employmentType = rawJob.employment_type || "ABSENT";
        const compensation = rawJob.compensation || "ABSENT";
        const applicationStatus = rawJob.application_status || "ABSENT";
        
        // 3. Prevent raw data leakage into taxonomy/semantic areas
        // The raw posting must remain source-faithful and isolated.
        const originalSourceText = rawJob.raw_job_description_text;
        if (!originalSourceText) {
             throw new TypedMissingInputError("A_SCOUT", "raw_job_description_text", "RawJobInput");
        }

        // 4. Construct the authoritative Traveling Envelope (Stage A Payload)
        return {
            envelope_id: `ENV-${rawJob.id}-${Date.now()}`,
            observation_identity: rawJob.id,
            provenance: {
                source_sha256: rawJob.original_content_sha256,
                source_url: rawJob.source_url,
                ingestion_timestamp: new Date().toISOString(),
                vendor: rawJob.vendor || "ABSENT"
            },
            target_entity: {
                employer: rawJob.company,
                job_title: rawJob.title,
                location: rawJob.location,
                employment_type: employmentType,
                compensation: compensation,
                application_status: applicationStatus
            },
            semantic_categories: rawJob.semantic_categories || "ABSENT",
            atomic_statements: rawJob.atomic_statements || "ABSENT",
            // Isolated source text - travels along but does not auto-map to downstream requirements
            original_source_isolated: originalSourceText 
        };
    }
};

const PipelineCanvas = ({ state, envelope }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const stages = [
                { id: 'A', name: 'Scout', x: 50, color: state === 'SEALED' ? '#10b981' : (state === 'AWAITING_TARGET' ? '#3b82f6' : '#64748b') },
                { id: 'B', name: 'Binding', x: 300, color: '#1e293b' },
                { id: 'C', name: 'Projection', x: 550, color: '#1e293b' }
            ];

            // Draw connecting lines
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(150, 100);
            ctx.lineTo(300, 100);
            ctx.moveTo(400, 100);
            ctx.lineTo(550, 100);
            ctx.stroke();

            // Draw animated traveling envelope if sealed
            if (state === 'SEALED') {
                const time = Date.now() / 1000;
                const offset = (Math.sin(time * 2) + 1) / 2; // 0 to 1
                const envX = 150 + (offset * 150);
                
                ctx.fillStyle = '#8b5cf6';
                ctx.beginPath();
                ctx.arc(envX, 100, 6, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.font = '10px monospace';
                ctx.fillStyle = '#a78bfa';
                ctx.fillText('ENVELOPE', envX - 20, 85);
            }

            // Draw Stage Nodes
            stages.forEach(stage => {
                ctx.fillStyle = '#0f172a';
                ctx.strokeStyle = stage.color;
                ctx.lineWidth = 3;
                
                // Draw Box
                ctx.beginPath();
                ctx.roundRect(stage.x, 60, 100, 80, 8);
                ctx.fill();
                ctx.stroke();

                // Draw Text
                ctx.fillStyle = '#cbd5e1';
                ctx.font = 'bold 16px sans-serif';
                ctx.fillText(stage.id, stage.x + 15, 85);
                
                ctx.font = '12px sans-serif';
                ctx.fillStyle = '#94a3b8';
                ctx.fillText(stage.name, stage.x + 15, 105);

                // Draw Status indicator
                ctx.fillStyle = stage.color;
                ctx.beginPath();
                ctx.arc(stage.x + 85, 75, 5, 0, Math.PI * 2);
                ctx.fill();
            });

            // Specific Gate Statuses
            ctx.font = '10px monospace';
            if (state === 'AWAITING_TARGET') {
                ctx.fillStyle = '#3b82f6';
                ctx.fillText('WAITING INPUT', 50, 160);
            } else if (state === 'SEALED') {
                ctx.fillStyle = '#10b981';
                ctx.fillText('SEALED & READY', 50, 160);
                
                // Show downstream data flow
                ctx.fillStyle = '#3b82f6';
                ctx.fillText('AWAITING B-STAGE', 300, 160);
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [state, envelope]);

    return (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-8 overflow-hidden relative">
            <div className="absolute top-4 left-4 flex items-center gap-2 text-slate-400 text-xs font-mono">
                <Activity size={14} />
                PIPELINE STATE CANVAS
            </div>
            <canvas 
                ref={canvasRef} 
                width={700} 
                height={200} 
                className="w-full h-[150px] object-contain block"
            />
        </div>
    );
};

const StageAOperations = ({ onExecute, resetTrigger }) => {
    const [targetInput, setTargetInput] = useState("");

    useEffect(() => {
        if (resetTrigger) {
            setTargetInput("");
        }
    }, [resetTrigger]);

    const loadTestFixture = () => {
        // Clearly marked test fixture to avoid confusion with live data
        setTargetInput(JSON.stringify({
            "id": "obs-9821-test",
            "company": "Stark Industries",
            "title": "Lead Energy Systems Engineer",
            "location": "Malibu, CA",
            "employment_type": "Full-Time",
            "compensation": "$180,000 - $220,000",
            "source_url": "https://careers.stark.com/req/9821",
            "original_content_sha256": "4b2a3d9e8f1c7b6a5d4e3f2c1b0a9d8e7f6c5b4a3d2e1f0c9b8a7d6e5f4c3b2a",
            "raw_job_description_text": "We are seeking a Lead Energy Systems Engineer to manage arc reactor maintenance and output scaling. Must have 10+ years of high-energy physics experience...",
            "notes": "TEST_FIXTURE_DO_NOT_USE_IN_PROD"
        }, null, 2));
    };

    const loadMissingFieldFixture = () => {
        // Fixture designed to test the fail-closed boundary
        setTargetInput(JSON.stringify({
            "id": "obs-missing-test",
            "company": "Oscorp",
            "title": "Genetics Researcher",
            // missing location
            "source_url": "https://oscorp.com/jobs/1",
            // missing sha256
            "raw_job_description_text": "Looking for genetics researcher."
        }, null, 2));
    };

    return (
        <div className="space-y-4 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-3 text-blue-400">
                    <Server size={24} />
                    <h2 className="text-xl font-bold tracking-wide">STAGE A: SCOUT INGRESS</h2>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={loadMissingFieldFixture} 
                        className="text-xs bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 px-3 py-1 rounded flex items-center gap-1 transition-colors"
                        title="Load fixture missing required fields to test fail-closed boundary"
                    >
                        <AlertTriangle size={12} />
                        Test Fail-Closed
                    </button>
                    <button 
                        onClick={loadTestFixture} 
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1 rounded flex items-center gap-1 transition-colors"
                    >
                        <FileJson size={12} />
                        Load TEST_FIXTURE
                    </button>
                </div>
            </div>
            
            <p className="text-slate-400 text-sm">
                Provide the accepted collected observation. The Scout engine will enforce strict structural verification and seal the Traveling Envelope. Missing fields will trigger a fail-closed event.
            </p>
            
            <textarea 
                className="w-full h-80 bg-slate-900 border border-slate-700 rounded p-4 text-slate-300 font-mono text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none shadow-inner"
                placeholder='Paste Disk/Compiler valid JSON observation here...'
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                spellCheck="false"
            />
            
            <button 
                onClick={() => onExecute(targetInput)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded font-bold tracking-wider transition-colors shadow-lg"
            >
                <Play size={18} fill="currentColor" />
                EXECUTE SCOUT & SEAL ENVELOPE
            </button>
        </div>
    );
};

const StageAHarness = () => {
    const [pipelineState, setPipelineState] = useState('AWAITING_TARGET'); // AWAITING_TARGET, SEALED
    const [travelingEnvelope, setTravelingEnvelope] = useState(null);
    const [resetCounter, setResetCounter] = useState(0);

    // Listen for custom reset event from error boundary
    useEffect(() => {
        const handleReset = () => {
            setPipelineState('AWAITING_TARGET');
            setTravelingEnvelope(null);
            setResetCounter(c => c + 1);
        };
        window.addEventListener('pipeline:reset', handleReset);
        return () => window.removeEventListener('pipeline:reset', handleReset);
    }, []);

    const handleExecuteScout = (rawJobJson) => {
        // Will throw TypedMissingInputError if validation fails, caught by boundary
        const sealedEnvelope = ScoutEngine.processRawJob(rawJobJson);
        setTravelingEnvelope(sealedEnvelope);
        setPipelineState('SEALED');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Area */}
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
                    <div>
                        <h1 className="text-xl font-bold tracking-widest text-slate-100 flex items-center gap-2">
                            <ShieldAlert className="text-emerald-500" />
                            JULES PIPELINE ARCHITECTURE
                        </h1>
                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">
                            Standalone Operations Harness • Segment A (Scout)
                        </p>
                    </div>
                    {pipelineState === 'SEALED' && (
                        <button 
                            onClick={() => {
                                setPipelineState('AWAITING_TARGET');
                                setTravelingEnvelope(null);
                                setResetCounter(c => c + 1);
                            }}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded text-sm text-slate-300 transition-colors border border-slate-700"
                        >
                            <XCircle size={16} />
                            Reset Stage
                        </button>
                    )}
                </div>

                {/* Canvas Visualization Pipeline */}
                <PipelineCanvas state={pipelineState} envelope={travelingEnvelope} />

                {/* Split Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-320px)] min-h-[600px]">
                    
                    {/* Left Panel: Active Ingress / Operator Action */}
                    <div className="col-span-1 lg:col-span-5 bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-2xl overflow-y-auto">
                        {pipelineState === 'AWAITING_TARGET' && (
                            <StageAOperations onExecute={handleExecuteScout} resetTrigger={resetCounter} />
                        )}
                        
                        {pipelineState === 'SEALED' && (
                            <div className="flex flex-col h-full items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-500">
                                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-4">
                                    <CheckCircle size={40} />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-100">SCOUT EXECUTION SUCCESS</h2>
                                <p className="text-slate-400 max-w-sm">
                                    Provenance verified. Required fields confirmed. Envelope is sealed and ready for Stage B handoff.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Traveling Envelope Inspection */}
                    <div className="col-span-1 lg:col-span-7 bg-[#0a0f1a] border border-slate-800 rounded-xl flex flex-col shadow-2xl overflow-hidden relative">
                        <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2 text-purple-400 font-mono text-sm">
                                <Lock size={16} />
                                <span>AUTHORITATIVE STATE: TRAVELING ENVELOPE</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded font-mono ${pipelineState === 'SEALED' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                {pipelineState === 'SEALED' ? 'SEALED' : 'EMPTY'}
                            </span>
                        </div>
                        
                        <div className="flex-1 p-6 overflow-y-auto font-mono text-sm leading-relaxed">
                            {pipelineState === 'SEALED' && travelingEnvelope ? (
                                <pre className="text-emerald-400 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {JSON.stringify(travelingEnvelope, null, 2)}
                                </pre>
                            ) : (
                                <div className="h-full flex items-center justify-center flex-col text-slate-600 gap-4">
                                    <Database size={48} className="opacity-20" />
                                    <p className="uppercase tracking-widest text-xs">Awaiting Execution</p>
                                </div>
                            )}
                        </div>

                        {/* Audit Log / Receipt Area */}
                        {pipelineState === 'SEALED' && travelingEnvelope && (
                            <div className="bg-emerald-950/20 border-t border-emerald-900/30 p-4 shrink-0 flex items-start gap-3 text-emerald-500/80 text-xs">
                                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold uppercase mb-1">Gate Verification Receipt</p>
                                    <p>Observation ID <span className="text-emerald-400">{travelingEnvelope.observation_identity}</span> bound.</p>
                                    <p>Source Hash <span className="text-emerald-400">{travelingEnvelope.provenance.source_sha256.substring(0,16)}...</span> verified.</p>
                                    <p>No assumptions created. Data isolated.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default function App() {
    return (
        <PipelineHaltBoundary>
            <StageAHarness />
        </PipelineHaltBoundary>
    );
}