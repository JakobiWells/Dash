from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import yt_dlp
import os
import re
import subprocess
import tempfile
import atexit

app = FastAPI()

# Write YOUTUBE_COOKIES env var to a temp file once at startup
_cookies_file = None
_cookies_raw = os.environ.get("YOUTUBE_COOKIES", "").strip()
if _cookies_raw:
    _tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False)
    _tmp.write(_cookies_raw)
    _tmp.close()
    _cookies_file = _tmp.name
    atexit.register(lambda: os.unlink(_cookies_file) if os.path.exists(_cookies_file) else None)

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
        fmt = "bestvideo+bestaudio/best"
    else:
        fmt = f"bestvideo[height<={req.quality}]+bestaudio/best[height<={req.quality}]/best"

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "format": fmt,
        "skip_download": True,
        "extractor_args": {"youtube": {"player_client": ["android", "web"]}},
    }
    if _cookies_file:
        ydl_opts["cookiefile"] = _cookies_file
    if os.environ.get("PROXY_URL"):
        ydl_opts["proxy"] = os.environ["PROXY_URL"]

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(req.url, download=False)
            if "entries" in info:
                info = info["entries"][0]
            title = info.get("title", "download")

        safe_title = re.sub(r'[^\w\s.-]', '_', title)[:200]

        def pick_url(fmt):
            return fmt.get("url") or fmt.get("manifest_url") if fmt else None

        if req.audio_only:
            codec = req.audio_format if req.audio_format != "best" else "mp3"
            mime = AUDIO_MIME.get(codec, "audio/mpeg")
            source_url = pick_url(info)
            if not source_url:
                raise HTTPException(status_code=500, detail="No audio URL in yt-dlp response")
            cmd = ["ffmpeg", "-i", source_url, "-vn", "-f", codec, "-"]
        else:
            mime = "video/mp4"
            codec = "mp4"
            requested = info.get("requested_formats") or []
            urls = [pick_url(f) for f in requested if f]
            urls = [u for u in urls if u]
            if len(urls) >= 2:
                cmd = [
                    "ffmpeg",
                    "-i", urls[0], "-i", urls[1],
                    "-c", "copy", "-f", "mp4",
                    "-movflags", "frag_keyframe+empty_moov", "-",
                ]
            else:
                direct_url = urls[0] if urls else pick_url(info)
                if not direct_url:
                    raise HTTPException(status_code=500, detail="No video URL in yt-dlp response")
                cmd = [
                    "ffmpeg", "-i", direct_url,
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
