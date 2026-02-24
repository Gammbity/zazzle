FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY pyproject.toml ./
RUN pip install --upgrade pip setuptools wheel
RUN pip install -e .[dev]

# Copy project
COPY . .

# Create directories for media and static files
RUN mkdir -p /app/media /app/static /app/logs

# Expose port
EXPOSE 8000

# Command
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]