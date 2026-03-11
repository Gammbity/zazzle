FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Python dependencies - separate layer for better caching
COPY pyproject.toml ./
RUN pip install --upgrade pip setuptools wheel \
    && pip install -e .[dev]

# Copy project
COPY . .

# Create directories for media and static files with open permissions
RUN mkdir -p /app/media /app/static /app/logs && \
    chmod -R 777 /app/logs /app/media /app/static

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

# Command
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]