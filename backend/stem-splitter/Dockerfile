FROM python:3.11-slim

RUN apt-get update && apt-get install -y ffmpeg libsndfile1 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Pre-bake models so they don't download at runtime
RUN python -c "from audio_separator.separator import Separator; s = Separator(); s.load_model('UVR-MDX-NET-Inst_HQ_3.onnx'); print('2-stem model loaded OK')"
RUN python -c "from audio_separator.separator import Separator; s = Separator(); s.load_model('htdemucs_4s.yaml'); print('4-stem model loaded OK')"

COPY . .

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
