from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import uuid, os, re, tempfile, shutil, subprocess, threading, time

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

JOBS: dict = {}  # job_id -> {status, stems, outdir, created_at, error}
MAX_FILE_MB = 150

def _cleanup_loop():
    while True:
        cutoff = time.time() - 1800  # 30 min
        for jid in list(JOBS):
            if JOBS[jid]["created_at"] < cutoff:
                d = JOBS[jid].get("outdir")
                if d and os.path.exists(d):
                    shutil.rmtree(d, ignore_errors=True)
                JOBS.pop(jid, None)
        time.sleep(120)

threading.Thread(target=_cleanup_loop, daemon=True).start()


@app.get("/")
def health():
    return {"ok": True, "service": "Dash Stem Splitter"}


@app.post("/split")
async def split(background_tasks: BackgroundTasks, file: UploadFile = File(...), stems: int = 4):
    content = await file.read()
    if len(content) > MAX_FILE_MB * 1024 * 1024:
        return JSONResponse({"error": f"File too large (max {MAX_FILE_MB} MB)"}, 400)

    job_id = str(uuid.uuid4())
    safe_name = re.sub(r"[^\w.-]", "_", file.filename or "audio.mp3")
    JOBS[job_id] = {"status": "processing", "stems": None, "outdir": None, "created_at": time.time(), "error": None}
    background_tasks.add_task(_process, job_id, content, safe_name, stems)
    return {"job_id": job_id}


def _process(job_id: str, content: bytes, filename: str, stem_count: int):
    tmpdir = tempfile.mkdtemp()
    JOBS[job_id]["outdir"] = tmpdir
    try:
        infile = os.path.join(tmpdir, filename)
        with open(infile, "wb") as f:
            f.write(content)

        cmd = ["python", "-m", "demucs", "--mp3", "-n", "mdx_extra", "--jobs", "4", "-o", tmpdir]
        if stem_count == 2:
            cmd += ["--two-stems", "vocals"]
        cmd.append(infile)

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=900)
        if result.returncode != 0:
            raise RuntimeError(result.stderr[-2000:])

        # Locate output directory: tmpdir/<model>/<basename>/
        base = os.path.splitext(filename)[0]
        out_stems = None
        for model_dir in os.listdir(tmpdir):
            candidate = os.path.join(tmpdir, model_dir, base)
            if os.path.isdir(candidate):
                out_stems = candidate
                break

        if not out_stems:
            raise RuntimeError("Demucs output directory not found")

        stems = {}
        for fname in os.listdir(out_stems):
            if fname.endswith((".mp3", ".wav")):
                name = os.path.splitext(fname)[0]
                stems[name] = os.path.join(out_stems, fname)

        JOBS[job_id]["status"] = "done"
        JOBS[job_id]["stems"] = stems

    except Exception as e:
        JOBS[job_id]["status"] = "error"
        JOBS[job_id]["error"] = str(e)


@app.get("/status/{job_id}")
def status(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        return JSONResponse({"status": "not_found"}, 404)
    return {
        "status": job["status"],
        "stems": list(job["stems"].keys()) if job.get("stems") else None,
        "error": job.get("error"),
    }


@app.get("/download/{job_id}/{stem}")
def download(job_id: str, stem: str):
    job = JOBS.get(job_id)
    if not job or not job.get("stems") or stem not in job["stems"]:
        return JSONResponse({"error": "Not found"}, 404)
    filepath = job["stems"][stem]
    ext = os.path.splitext(filepath)[1]
    mime = "audio/mpeg" if ext == ".mp3" else "audio/wav"
    return FileResponse(filepath, media_type=mime,
                        headers={"Content-Disposition": f'attachment; filename="{stem}{ext}"'})
