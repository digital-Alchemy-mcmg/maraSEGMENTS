#!/usr/bin/env python3
import json
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from src.harness_runner import StageBHarness


def execute(payload):
    h=StageBHarness()
    h.load_input_data(payload.get("envelope"), payload.get("sidecar"), payload.get("candidate_sdna_yaml", ""))
    result=h.execute_stage_b()
    return {"result":result,"envelope":h.envelope.to_dict()}


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path=="/": self.path="/stage_b_canvas.html"
        return super().do_GET()
    def do_POST(self):
        if self.path!="/api/stage_b": return self.send_error(404)
        try:
            n=int(self.headers.get("Content-Length","0")); payload=json.loads(self.rfile.read(n).decode("utf-8")); data=execute(payload); code=200
        except Exception as e:
            code=422; data={"status":"HALTED_B","error":str(e),"downstream_execution_permitted":False}
        raw=json.dumps(data,indent=2).encode("utf-8")
        self.send_response(code); self.send_header("Content-Type","application/json"); self.send_header("Content-Length",str(len(raw))); self.end_headers(); self.wfile.write(raw)


if __name__=="__main__":
    print("Stage B operator surface: http://0.0.0.0:8000")
    ThreadingHTTPServer(("0.0.0.0",8000),Handler).serve_forever()
