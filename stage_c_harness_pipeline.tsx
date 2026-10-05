import React, { useState } from 'react';
import { Play, FastForward, RotateCcw, AlertTriangle, CheckCircle, Lock, Layers } from 'lucide-react';

const INVARIANTS = [
  'Zero new evidence created in C1–C5',
  'All claims remain traceable to admitted upstream atoms',
  'Semantic authority remains upstream of layout and rendering',
  'Each C stage writes only its owned output',
  'Failure routing does not mutate upstream evidence',
];

export default function StageCHarness({ initialEnvelope, executeStage, executeAll }) {
  const [envelope, setEnvelope] = useState(initialEnvelope ?? null);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);

  const requireIngress = () => {
    if (!envelope) throw new Error('Stage C requires an actual Stage B handoff envelope. No default envelope exists.');
  };

  const step = async () => {
    try {
      requireIngress();
      if (typeof executeStage !== 'function') throw new Error('No Stage C executor was supplied.');
      setRunning(true); setError(null);
      const result = await executeStage(envelope, stage + 1);
      if (!result?.envelope) throw new Error('Executor returned no envelope.');
      setEnvelope(result.envelope); setStage(result.stage ?? stage + 1);
    } catch (e) { setError(String(e)); }
    finally { setRunning(false); }
  };

  const run = async () => {
    try {
      requireIngress();
      if (typeof executeAll !== 'function') throw new Error('No Stage C executor was supplied.');
      setRunning(true); setError(null);
      const result = await executeAll(envelope);
      if (!result?.envelope) throw new Error('Executor returned no envelope.');
      setEnvelope(result.envelope); setStage(result.stage ?? 5);
    } catch (e) { setError(String(e)); }
    finally { setRunning(false); }
  };

  const reset = () => { setEnvelope(initialEnvelope ?? null); setStage(0); setError(null); };
  const factory = envelope?.C_factory ?? {};
  const outputs = [factory.C1_docket, factory.C2_claims, factory.C3_model, factory.C4_layout, factory.C5_artifact];

  return <div className="min-h-screen bg-slate-950 text-slate-300 p-6">
    <header className="flex justify-between border-b border-slate-800 pb-4">
      <div><h1 className="text-xl font-bold">STAGE C HARNESS // C1–C5</h1><p className="text-xs text-slate-500">Actual B5 handoff required. No mock runtime state exists.</p></div>
      <div className="flex gap-2">
        <button onClick={step} disabled={running || !envelope || stage >= 5}><Play size={16}/>Step</button>
        <button onClick={run} disabled={running || !envelope || stage >= 5}><FastForward size={16}/>Run</button>
        <button onClick={reset}><RotateCcw size={16}/>Reset</button>
      </div>
    </header>
    {!envelope && <div className="mt-6 border border-amber-700 p-4 text-amber-300"><AlertTriangle size={16} className="inline mr-2"/>AWAITING ACTUAL B5 HANDOFF</div>}
    {error && <div className="mt-4 border border-red-700 p-4 text-red-300">{error}</div>}
    <section className="grid grid-cols-5 gap-3 mt-6">
      {outputs.map((value, i) => <div key={i} className="border border-slate-800 p-3 rounded">
        <Layers size={16}/><div className="font-bold">C{i+1}</div>
        <div className="text-xs">{value ? <span className="text-emerald-400"><CheckCircle size={12} className="inline"/> COMMITTED</span> : 'IDLE'}</div>
      </div>)}
    </section>
    <section className="mt-6 border border-slate-800 rounded p-4">
      <div className="flex items-center gap-2 font-bold"><Lock size={16}/>Traveling Envelope</div>
      <pre className="text-xs whitespace-pre-wrap mt-3">{envelope ? JSON.stringify(envelope, null, 2) : ''}</pre>
    </section>
    <footer className="mt-6 flex gap-2 flex-wrap">{INVARIANTS.map(x => <span key={x} className="text-xs border border-emerald-900 px-2 py-1 rounded">{x}</span>)}</footer>
  </div>;
}
