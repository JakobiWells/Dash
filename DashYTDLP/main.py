from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yt_dlp
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class ExtractRequest(BaseModel):
    url: str
    audio_only: bool = False
    quality: str = "best"


@app.get("/")
def health():
    return {"ok": True, "service": "Dash yt-dlp"}


@app.post("/extract")
def extract(req: ExtractRequest):
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

    proxy = os.environ.get("PROXY_URL")
    if proxy:
        ydl_opts["proxy"] = proxy

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(req.url, download=False)

            # Handle playlists — take first entry
            if "entries" in info:
                info = info["entries"][0]

            url = info.get("url")
            if not url:
                raise HTTPException(status_code=400, detail="Could not extract download URL")

            return {
                "url": url,
                "title": info.get("title", "download"),
                "ext": info.get("ext", "mp4"),
                "thumbnail": info.get("thumbnail"),
                "duration": info.get("duration"),
            }

    except HTTPException:
        raise
    except yt_dlp.utils.DownloadError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
