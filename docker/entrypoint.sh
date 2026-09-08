#!/bin/sh
set -e

python <<'PY'
import os
import socket
import time

engine = os.getenv("DATABASE_ENGINE", "sqlite").lower()
database_hosts = {
    "mysql": (os.getenv("MYSQL_HOST", "db"), int(os.getenv("MYSQL_PORT", "3306"))),
    "postgres": (os.getenv("POSTGRES_HOST", "postgres"), int(os.getenv("POSTGRES_PORT", "5432"))),
    "postgresql": (os.getenv("POSTGRES_HOST", "postgres"), int(os.getenv("POSTGRES_PORT", "5432"))),
}

if engine not in database_hosts:
    raise SystemExit

host, port = database_hosts[engine]
deadline = time.time() + 60

while True:
    try:
        with socket.create_connection((host, port), timeout=2):
            break
    except OSError:
        if time.time() > deadline:
            raise
        time.sleep(1)
PY

python manage.py migrate --noinput
python manage.py collectstatic --noinput
python manage.py ensure_superuser

if [ "${SEED_DEMO}" = "True" ] || [ "${SEED_DEMO}" = "true" ] || [ "${SEED_DEMO}" = "1" ]; then
  python manage.py seed_demo
fi

exec "$@"
