from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
import io

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Lazy-load so the service starts fast
_p2t = None

def get_p2t():
    global _p2t
    if _p2t is None:
        from pix2text import Pix2Text
        _p2t = Pix2Text.from_config()
    return _p2t


@app.get("/")
def health():
    return {"ok": True, "service": "Dash Pix2Text"}


@app.post("/convert")
async def convert(file: UploadFile = File(...), mode: str = Form("mixed")):
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        return JSONResponse({"error": "File too large (max 10 MB)"}, 400)

    try:
        image = Image.open(io.BytesIO(content)).convert("RGB")
        p2t = get_p2t()

        if mode == "math":
            latex = p2t.recognize_formula(image)
            if not isinstance(latex, str):
                latex = str(latex)
            return {
                "mode": "math",
                "segments": [{"type": "formula", "text": latex}],
                "raw": latex,
            }
        else:
            result = p2t.recognize(image)
            # Normalize: result can be str or list of dicts
            if isinstance(result, str):
                segments = [{"type": "text", "text": result}]
                raw = result
            elif isinstance(result, list):
                segments = []
                parts = []
                for item in result:
                    if isinstance(item, dict):
                        t = item.get("type", "text")
                        text = item.get("text", "")
                        segments.append({"type": t, "text": text})
                        parts.append(f"${text}$" if t == "formula" else text)
                    else:
                        segments.append({"type": "text", "text": str(item)})
                        parts.append(str(item))
                raw = " ".join(parts)
            else:
                raw = str(result)
                segments = [{"type": "text", "text": raw}]

            return {"mode": "mixed", "segments": segments, "raw": raw}

    except Exception as e:
        return JSONResponse({"error": str(e)}, 500)
