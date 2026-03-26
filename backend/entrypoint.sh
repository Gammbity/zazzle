#!/bin/sh
set -eu

MODE="${1:-web}"

wait_for_database() {
  python - <<'PY'
import os
import socket
import sys
import time
from urllib.parse import urlparse

database_url = os.environ.get("DATABASE_URL", "")
parsed = urlparse(database_url)
host = parsed.hostname or "db"
port = parsed.port or 5432

last_error = None

for attempt in range(1, 31):
    try:
        socket.getaddrinfo(host, port)
        with socket.create_connection((host, port), timeout=2):
            print(f"[entrypoint] database is reachable at {host}:{port}")
            sys.exit(0)
    except OSError as exc:
        last_error = exc
        print(
            f"[entrypoint] waiting for database {host}:{port} "
            f"(attempt {attempt}/30): {exc}",
            flush=True,
        )
        time.sleep(2)

print(f"[entrypoint] database is still unavailable: {last_error}", flush=True)
sys.exit(1)
PY
}

wait_for_database

case "$MODE" in
  web)
    python manage.py collectstatic --noinput
    python manage.py migrate --noinput
    exec python manage.py runserver 0.0.0.0:8000
    ;;
  celery)
    exec celery -A zazzle worker -l info
    ;;
  celery-beat)
    exec celery -A zazzle beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
    ;;
  *)
    exec "$@"
    ;;
esac
