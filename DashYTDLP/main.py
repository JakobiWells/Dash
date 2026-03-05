from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import yt_dlp
import os
import re
import shutil
import tempfile

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

AUDIO_MIME = {
    "mp3": "audio/mpeg",
    "wav": "audio/wav",
    "ogg": "audio/ogg",
    "opus": "audio/ogg",
    "m4a": "audio/mp4",
}


class DownloadRequest(BaseModel):
    url: str
    audio_only: bool = False
    quality: str = "best"
    audio_format: str = "mp3"


@app.get("/")
def health():
    return {"ok": True, "service": "Dash yt-dlp"}


@app.post("/download")
def download(req: DownloadRequest):
    tmpdir = tempfile.mkdtemp()
    try:
        if req.audio_only:
            fmt = "bestaudio/best"
            if req.audio_format == "best":
                postprocessors = []
                out_ext = None  # determined after download
            else:
                postprocessors = [{"key": "FFmpegExtractAudio", "preferredcodec": req.audio_format}]
                out_ext = req.audio_format
            mime = AUDIO_MIME.get(req.audio_format, "audio/mpeg")
        else:
            if req.quality in ("best", "max"):
                fmt = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"
            else:
                fmt = f"bestvideo[height<={req.quality}][ext=mp4]+bestaudio[ext=m4a]/best[height<={req.quality}][ext=mp4]/best"
            postprocessors = []
            out_ext = "mp4"
            mime = "video/mp4"

        ydl_opts = {
            "quiet": True,
            "format": fmt,
            "outtmpl": f"{tmpdir}/%(title)s.%(ext)s",
            "postprocessors": postprocessors,
        }

        proxy = os.environ.get("PROXY_URL")
        if proxy:
            ydl_opts["proxy"] = proxy

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(req.url, download=True)
            if "entries" in info:
                info = info["entries"][0]
            base = os.path.splitext(ydl.prepare_filename(info))[0]
            if out_ext:
                filepath = f"{base}.{out_ext}"
            else:
                # "best" format — find whatever file was written
                filepath = ydl.prepare_filename(info)
                out_ext = info.get("ext", "mp4")
                mime = AUDIO_MIME.get(out_ext, "audio/mpeg") if req.audio_only else "video/mp4"
            title = info.get("title", "download")

        safe_title = re.sub(r'[^\w\s.-]', '_', title)[:200]

        def iterfile():
            with open(filepath, "rb") as f:
                yield from f
            shutil.rmtree(tmpdir, ignore_errors=True)

        return StreamingResponse(
            iterfile(),
            media_type=mime,
            headers={"Content-Disposition": f'attachment; filename="{safe_title}.{out_ext}"'},
        )

    except yt_dlp.utils.DownloadError as e:
        shutil.rmtree(tmpdir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        shutil.rmtree(tmpdir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))
