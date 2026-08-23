#!/bin/sh
set -e

if [ "${USE_MYSQL}" = "True" ] || [ "${USE_MYSQL}" = "true" ] || [ "${USE_MYSQL}" = "1" ]; then
  python <<'PY'
import os
import socket
import time

host = os.getenv("MYSQL_HOST", "db")
port = int(os.getenv("MYSQL_PORT", "3306"))
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
fi

python manage.py migrate --noinput
python manage.py collectstatic --noinput
python manage.py ensure_superuser

if [ "${SEED_DEMO}" = "True" ] || [ "${SEED_DEMO}" = "true" ] || [ "${SEED_DEMO}" = "1" ]; then
  python manage.py seed_demo
fi

exec "$@"
