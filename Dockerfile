FROM node:22-alpine AS frontend-builder

WORKDIR /frontend

ARG VITE_API_BASE_URL=/api/v1
ARG VITE_CAPTCHA_ENABLED=False
ARG VITE_TURNSTILE_SITE_KEY=

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_CAPTCHA_ENABLED=$VITE_CAPTCHA_ENABLED \
    VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM python:3.13-slim AS app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . ./
COPY --from=frontend-builder /frontend/dist ./frontend/dist

RUN chmod +x ./docker/entrypoint.sh \
    && useradd --create-home --shell /usr/sbin/nologin django \
    && mkdir -p /app/staticfiles /app/media \
    && chown -R django:django /app

USER django

EXPOSE 8000

ENTRYPOINT ["./docker/entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
