# syntax=docker/dockerfile:1

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# If you plan to compile psycopg2 from source, keep these.
# If you use psycopg2-binary or psycopg[binary], you can delete this RUN.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps and system tools
COPY requirements.txt .
RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    apt-get update && \
    apt-get install -y netcat-openbsd && \
    rm -rf /var/lib/apt/lists/*

# Copy app
COPY . .

# Make startup script executable
RUN chmod +x start.sh

# Non-root
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 3001
ENV PORT=3001

CMD ["./start.sh"]
