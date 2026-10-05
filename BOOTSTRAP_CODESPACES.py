#!/usr/bin/env python3
import os, zipfile, textwrap

ROOT = os.path.dirname(os.path.abspath(__file__))
ZIP = os.path.join(ROOT, "STAGE_A_HARNESS.zip")

if not os.path.exists(ZIP):
    raise SystemExit("STAGE_A_HARNESS.zip missing")

with zipfile.ZipFile(ZIP, "r") as z:
    z.extractall(ROOT)

os.makedirs(os.path.join(ROOT, "api"), exist_ok=True)
os.makedirs(os.path.join(ROOT, "tests"), exist_ok=True)

tests = r'''import unittest, os, json, copy, hashlib, shutil
from src.harness_runner import StageAHarness
from src.scout import SegmentAState, deterministic_envelope_id

def h(v): return hashlib.sha256(json.dumps(v, sort_keys=True).encode()).hexdigest()

def sdna():
    m={"subject":{"id":"candidate-test-001"},"integrity":{},"domains":{"WORK_HISTORY":{"atoms":[{"atom_id":"a1","content":"test","source_pointer":"src#1"}]}}}
    mh=h(m)
    return {"sdna_manifest":m,"sdna_subject_id":"candidate-test-001","sdna_version":"2.0.0","sdna_source_hash":mh,"prominence_reference":"sdna://candidate-test-001/prominence","source_evidence_references":["src#1"]}

def comp():
    raw="Authoritative raw target posting used for Segment A execution testing."
    sh=hashlib.sha256(raw.encode()).hexdigest()
    o={"id":"obs-test-001","company":"Test Company","title":"Test Role","location":"Detroit, MI","source_url":"https://example.invalid/job","original_content_sha256":sh,"raw_job_description_text":raw,"employment_type":"Full-Time","compensation":"ABSENT","application_status":"UNAPPLIED","vendor":"TEST"}
    oh=h(o)
    return {"compiler_receipt":{"output_hash":oh},"compiler_schema_version":"1.0.0","compiler_output_hash":oh,"source_hash":sh,"observation":o}

class T(unittest.TestCase):
    def setUp(self):
        self.s=sdna(); self.c=comp(); self.h=StageAHarness()
    def tearDown(self): shutil.rmtree("./test_output_a", ignore_errors=True)

    def test_happy_path_and_determinism(self):
        ok,r=self.h.execute_segment_a(self.s,self.c); self.assertTrue(ok); self.assertEqual(r["status"],"SEALED_A")
        e=r["envelope"]
        expected=deterministic_envelope_id("2.0.0",self.s["sdna_source_hash"],self.c["compiler_output_hash"],self.c["source_hash"])
        self.assertEqual(e["envelope_id"],expected)
        ok2,r2=StageAHarness().execute_segment_a(self.s,self.c); self.assertTrue(ok2); self.assertEqual(r2["envelope"]["envelope_id"],expected)
        self.assertFalse(e["isolated_source"]["mutation_allowed"]); self.assertFalse(e["isolated_source"]["interpretation_allowed_in_A"])
        self.assertEqual(e["downstream"]["B_status"],"NOT_EXECUTED"); self.assertEqual(e["downstream"]["C_status"],"NOT_EXECUTED")
        p=self.h.export_handoff_package("./test_output_a")
        self.assertTrue(all(os.path.exists(x) for x in p.values()))

    def test_missing_sdna_halts(self):
        ok,r=self.h.execute_segment_a(None,self.c); self.assertFalse(ok); self.assertEqual(r["status"],"HALTED_A")
        self.assertEqual(self.h.engine.state,SegmentAState.HALTED_A); self.assertFalse(r["failure_receipt"]["downstream_execution_permitted"])

    def test_compiler_hash_tamper_halts(self):
        c=copy.deepcopy(self.c); c["observation"]["title"]="tampered"
        ok,r=self.h.execute_segment_a(self.s,c); self.assertFalse(ok); self.assertEqual(r["failure_receipt"]["current_substage"],"A4_VERIFY_COMPILER")

    def test_raw_text_tamper_halts(self):
        c=copy.deepcopy(self.c); c["observation"]["raw_job_description_text"]="altered"; c["compiler_output_hash"]=h(c["observation"]); c["compiler_receipt"]["output_hash"]=c["compiler_output_hash"]
        ok,r=self.h.execute_segment_a(self.s,c); self.assertFalse(ok); self.assertEqual(r["failure_receipt"]["current_substage"],"A4_VERIFY_COMPILER")

    def test_optional_absent_not_inferred(self):
        c=copy.deepcopy(self.c)
        for k in ("employment_type","compensation","application_status","vendor"): del c["observation"][k]
        c["compiler_output_hash"]=h(c["observation"]); c["compiler_receipt"]["output_hash"]=c["compiler_output_hash"]
        ok,r=self.h.execute_segment_a(self.s,c); self.assertTrue(ok)
        t=r["envelope"]["observation"]["target_entity"]
        self.assertTrue(all(t[k]=="ABSENT" for k in ("employment_type","compensation","application_status","vendor")))

if __name__=="__main__": unittest.main()
'''
open(os.path.join(ROOT,"tests","test_stage_a.py"),"w",encoding="utf-8").write(tests)

run = r'''#!/usr/bin/env python3
import sys, os, json, argparse
from src.harness_runner import StageAHarness

def load(path,label):
    if not path or not os.path.exists(path): raise FileNotFoundError(f"{label} missing: {path}")
    with open(path,encoding="utf-8") as f: return json.load(f)

p=argparse.ArgumentParser()
p.add_argument("--sdna-package",required=True)
p.add_argument("--compiler-package",required=True)
p.add_argument("--output",default="./output_stage_a")
a=p.parse_args()
try: s=load(a.sdna_package,"SDNA package"); c=load(a.compiler_package,"compiler package")
except Exception as e: print("INPUT ERROR:",e); sys.exit(1)
h=StageAHarness(); ok,r=h.execute_segment_a(s,c)
print(json.dumps(r,indent=2))
if not ok: sys.exit(1)
print(json.dumps(h.export_handoff_package(a.output),indent=2))
'''
open(os.path.join(ROOT,"run_stage_a.py"),"w",encoding="utf-8").write(run)

api = r'''import json
from http.server import BaseHTTPRequestHandler
from src.harness_runner import StageAHarness

def execute_payload(payload):
    h=StageAHarness()
    return h.execute_segment_a(payload.get("sdna_package"),payload.get("compiler_package"))

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            n=int(self.headers.get("Content-Length","0")); payload=json.loads(self.rfile.read(n).decode())
            ok,r=execute_payload(payload); code=200 if ok else 422
        except Exception as e:
            code=400; r={"status":"HALTED_A","failure_receipt":{"stage":"A","current_substage":"INGRESS","result":"FAIL","error":str(e),"reconstruction_permitted":False,"downstream_execution_permitted":False}}
        raw=json.dumps(r,indent=2).encode()
        self.send_response(code); self.send_header("Content-Type","application/json"); self.send_header("Content-Length",str(len(raw))); self.end_headers(); self.wfile.write(raw)
'''
open(os.path.join(ROOT,"api","segment_a.py"),"w",encoding="utf-8").write(api)

dev = r'''#!/usr/bin/env python3
import json
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from api.segment_a import execute_payload

class H(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path=="/": self.path="/index.html"
        return super().do_GET()
    def do_POST(self):
        if self.path!="/api/segment_a": return self.send_error(404)
        try:
            n=int(self.headers.get("Content-Length","0")); p=json.loads(self.rfile.read(n).decode()); ok,r=execute_payload(p); code=200 if ok else 422
        except Exception as e:
            code=400; r={"status":"HALTED_A","failure_receipt":{"stage":"A","current_substage":"INGRESS","result":"FAIL","error":str(e),"reconstruction_permitted":False,"downstream_execution_permitted":False}}
        b=json.dumps(r,indent=2).encode(); self.send_response(code); self.send_header("Content-Type","application/json"); self.send_header("Content-Length",str(len(b))); self.end_headers(); self.wfile.write(b)

if __name__=="__main__":
    print("Segment A test surface: http://0.0.0.0:8000")
    ThreadingHTTPServer(("0.0.0.0",8000),H).serve_forever()
'''
open(os.path.join(ROOT,"dev_server.py"),"w",encoding="utf-8").write(dev)

html = r'''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Segment A Test</title><style>body{background:#08111f;color:#dbe7f5;font-family:monospace;margin:0}.w{max-width:1400px;margin:auto;padding:24px}.g{display:grid;grid-template-columns:1fr 1fr;gap:16px}.c{background:#0c1728;border:1px solid #29415d;border-radius:10px;padding:16px}textarea{width:100%;height:360px;box-sizing:border-box;background:#050a12;color:#dbe7f5;border:1px solid #36516e;padding:12px}button{width:100%;margin:16px 0;padding:14px;background:#2563eb;color:#fff;border:0;border-radius:8px;font-weight:bold}pre{white-space:pre-wrap;word-break:break-word}@media(max-width:900px){.g{grid-template-columns:1fr}}</style></head><body><div class="w"><h1>SEGMENT A — A0→A11 EXECUTION TEST</h1><p>SDNA verifies first. Target/compiler intake does not proceed until A2 passes.</p><div class="g"><div class="c"><h3>A1 — CANONICAL SDNA PACKAGE JSON</h3><textarea id="s" placeholder="Paste your SDNA JSON here"></textarea></div><div class="c"><h3>A3 — COMPILER / TARGET PACKAGE JSON</h3><textarea id="c" placeholder="Paste compiler package JSON here"></textarea></div></div><button id="r">EXECUTE A0 → A11</button><div class="c"><h3 id="st">AWAITING INPUT</h3><pre id="o"></pre></div></div><script>r.onclick=async()=>{try{st.textContent="RUNNING";let p={sdna_package:JSON.parse(s.value),compiler_package:JSON.parse(c.value)};let x=await fetch("/api/segment_a",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});let j=await x.json();st.textContent=j.status||"UNKNOWN";o.textContent=JSON.stringify(j,null,2)}catch(e){st.textContent="HALTED_A";o.textContent=String(e)}}</script></body></html>'''
open(os.path.join(ROOT,"index.html"),"w",encoding="utf-8").write(html)

vercel='''{"functions":{"api/segment_a.py":{"runtime":"python3.12"}},"rewrites":[{"source":"/api/segment_a","destination":"/api/segment_a.py"}]}'''
open(os.path.join(ROOT,"vercel.json"),"w",encoding="utf-8").write(vercel)

print("Segment A Codespaces bootstrap complete.")
