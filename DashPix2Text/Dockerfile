FROM python:3.11-slim

RUN apt-get update && apt-get install -y ffmpeg libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# CPU-only PyTorch to avoid the ~2.5 GB CUDA build
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

RUN pip install --no-cache-dir -r requirements.txt

# Pre-bake all models so they don't download at runtime
RUN python -c "
from pix2text import Pix2Text
p2t = Pix2Text.from_config()
print('pix2text models loaded OK')
"

COPY . .

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
