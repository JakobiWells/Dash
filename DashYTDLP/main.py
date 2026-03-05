from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import yt_dlp
import os
import re
import subprocess

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
    if req.audio_only:
        fmt = "bestaudio/best"
    elif req.quality in ("best", "max"):
        fmt = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"
    else:
        fmt = f"bestvideo[height<={req.quality}][ext=mp4]+bestaudio[ext=m4a]/best[height<={req.quality}][ext=mp4]/best"

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "format": fmt,
        "skip_download": True,
    }
    if os.environ.get("PROXY_URL"):
        ydl_opts["proxy"] = os.environ["PROXY_URL"]

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(req.url, download=False)
            if "entries" in info:
                info = info["entries"][0]
            title = info.get("title", "download")

        safe_title = re.sub(r'[^\w\s.-]', '_', title)[:200]

        if req.audio_only:
            codec = req.audio_format if req.audio_format != "best" else "mp3"
            mime = AUDIO_MIME.get(codec, "audio/mpeg")
            source_url = info.get("url")
            cmd = ["ffmpeg", "-i", source_url, "-vn", "-f", codec, "-"]
        else:
            mime = "video/mp4"
            codec = "mp4"
            # Handle separate video+audio adaptive streams
            requested = info.get("requested_formats")
            if requested and len(requested) >= 2:
                cmd = [
                    "ffmpeg",
                    "-i", requested[0]["url"],
                    "-i", requested[1]["url"],
                    "-c", "copy", "-f", "mp4",
                    "-movflags", "frag_keyframe+empty_moov", "-",
                ]
            else:
                cmd = [
                    "ffmpeg", "-i", info.get("url"),
                    "-c", "copy", "-f", "mp4",
                    "-movflags", "frag_keyframe+empty_moov", "-",
                ]

        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)

        def generate():
            try:
                while chunk := proc.stdout.read(65536):
                    yield chunk
            finally:
                proc.kill()
                proc.wait()

        return StreamingResponse(
            generate(),
            media_type=mime,
            headers={"Content-Disposition": f'attachment; filename="{safe_title}.{codec}"'},
        )

    except HTTPException:
        raise
    except yt_dlp.utils.DownloadError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
