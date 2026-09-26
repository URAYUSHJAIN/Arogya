# Arogya backend: FastAPI + RAG pipeline (CPU-only). Build context = repo root.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/root/.cache/huggingface \
    API_HOST=0.0.0.0 \
    API_PORT=8010

WORKDIR /app/rag-pipeline

# CPU-only PyTorch first (avoids multi-GB CUDA wheels), then the pinned requirements.
COPY rag-pipeline/requirements.txt .
RUN pip install --index-url https://download.pytorch.org/whl/cpu "torch==2.3.1" \
 && pip install -r requirements.txt

COPY rag-pipeline/ .

EXPOSE 8010
CMD ["python", "server.py"]
