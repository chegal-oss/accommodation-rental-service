# HomeRent

Property rental service with a Django REST framework API and React frontend for
real estate listings, bookings, reviews, and basic analytics.

## Apps

- `users`: custom user model, registration, JWT auth, current user endpoint.
- `listing`: listings, listing images, search, filters, ordering.
- `bookings`: booking requests, confirmation, rejection, cancellation.
- `reviews`: listing reviews based on completed confirmed bookings.
- `analytics`: search history, listing views, popular searches and listings.

## API

Base path:

```text
/api/v1/
```

API documentation:

```text
GET /api/schema/
GET /api/docs/
```

Auth:

```text
POST  /api/v1/auth/register/
POST  /api/v1/auth/token/
POST  /api/v1/auth/token/refresh/
GET   /api/v1/auth/me/
PATCH /api/v1/auth/me/
```

Listings:

```text
GET    /api/v1/listings/
POST   /api/v1/listings/
GET    /api/v1/listings/<id>/
PATCH  /api/v1/listings/<id>/
DELETE /api/v1/listings/<id>/
GET    /api/v1/listings/my/
POST   /api/v1/listings/<id>/images/
GET    /api/v1/listings/<id>/reviews/
```

Bookings:

```text
GET  /api/v1/bookings/
POST /api/v1/bookings/
GET  /api/v1/bookings/<id>/
GET  /api/v1/bookings/my/
POST /api/v1/bookings/<id>/confirm/
POST /api/v1/bookings/<id>/reject/
POST /api/v1/bookings/<id>/cancel/
```

Reviews:

```text
GET    /api/v1/reviews/
POST   /api/v1/reviews/
GET    /api/v1/reviews/<id>/
PATCH  /api/v1/reviews/<id>/
DELETE /api/v1/reviews/<id>/
```

Analytics:

```text
GET /api/v1/analytics/my-searches/
GET /api/v1/analytics/my-views/
GET /api/v1/analytics/popular-searches/
GET /api/v1/analytics/popular-listings/
```

## Listing Query Examples

```text
GET /api/v1/listings/?search=berlin
GET /api/v1/listings/?min_price=800&max_price=1500
GET /api/v1/listings/?min_rooms=2&max_rooms=4
GET /api/v1/listings/?housing_type=apartment
GET /api/v1/listings/?ordering=-views_count
GET /api/v1/listings/?ordering=price
```

## Development Commands

```bash
.venv/bin/python manage.py migrate
.venv/bin/python manage.py runserver 127.0.0.1:8000
```

Backend checks:

```bash
.venv/bin/python manage.py makemigrations
.venv/bin/python manage.py check
.venv/bin/python -m ruff check .
.venv/bin/python manage.py test
.venv/bin/python manage.py seed_demo
```

## Frontend

The frontend lives in `frontend/` and uses React, Vite, TypeScript, Tailwind CSS,
TanStack Query, React Router, and i18next.

Run it separately during frontend development:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Useful frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

## Single Port Mode

For the single-port mode, build the frontend and let Django serve the compiled
SPA:

```bash
cd frontend
npm run build

cd ..
.venv/bin/python manage.py collectstatic --noinput
.venv/bin/python manage.py runserver 127.0.0.1:8000
```

Routes:

```text
/          -> React frontend
/listings  -> React frontend route
/api/v1/   -> DRF API
/api/docs/ -> Swagger UI
/admin/    -> Django Admin
```

The frontend production build uses:

```text
VITE_API_BASE_URL=/api/v1
```

## Environment

Copy `.env.example` to `.env` and adjust values if needed.

SQLite is used by default:

```text
USE_MYSQL=False
LOG_LEVEL=INFO
```

To use MySQL:

```text
USE_MYSQL=True
MYSQL_DATABASE=accommodation_rental_service
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
```

## Docker Compose

Compose runs three services:

- `app`: one Docker image with the React build, Django, Gunicorn, migrations and
  static collection on startup.
- `db`: minimal MySQL 8.4 with `utf8mb4`.
- `caddy`: public entrypoint, reverse proxying Django and serving `/static/` and
  `/media/` from shared volumes.

Create Docker env values:

```bash
cp .env.docker.example .env.docker
```

For local testing, the defaults use `localhost`. For a real HTTPS deployment,
set at least:

```text
DOCKER_SECRET_KEY=<strong-secret>
DOCKER_ALLOWED_HOSTS=example.com
DOCKER_CSRF_TRUSTED_ORIGINS=https://example.com
DOCKER_CADDY_SITE_ADDRESS=example.com
DOCKER_HTTP_PORT=80
DOCKER_HTTPS_PORT=443
DOCKER_SESSION_COOKIE_SECURE=True
DOCKER_CSRF_COOKIE_SECURE=True
DOCKER_CAPTCHA_ENABLED=True
DOCKER_VITE_CAPTCHA_ENABLED=True
DOCKER_TURNSTILE_SITE_KEY=<cloudflare-turnstile-site-key>
DOCKER_TURNSTILE_SECRET_KEY=<cloudflare-turnstile-secret-key>
DOCKER_MYSQL_PASSWORD=<strong-password>
DOCKER_MYSQL_ROOT_PASSWORD=<strong-root-password>
```

Build and run:

```bash
docker compose --env-file .env.docker up --build
```

Useful commands:

```bash
docker compose --env-file .env.docker exec app python manage.py createsuperuser
docker compose --env-file .env.docker exec app python manage.py seed_demo
docker compose --env-file .env.docker down
```

To create a Django admin user automatically during container startup, set:

```text
DOCKER_SUPERUSER_EMAIL=admin@example.com
DOCKER_SUPERUSER_PASSWORD=<strong-admin-password>
DOCKER_SUPERUSER_NAME=Admin
DOCKER_SUPERUSER_PHONE=
DOCKER_SUPERUSER_ROLE=landlord
```

The startup command is idempotent: if this user already exists, it will not
create a duplicate.

To protect registration with Cloudflare Turnstile, set both backend and frontend
captcha flags:

```text
DOCKER_CAPTCHA_ENABLED=True
DOCKER_VITE_CAPTCHA_ENABLED=True
DOCKER_TURNSTILE_SITE_KEY=<cloudflare-turnstile-site-key>
DOCKER_TURNSTILE_SECRET_KEY=<cloudflare-turnstile-secret-key>
```

For local testing, Cloudflare provides test keys that always pass:

```text
DOCKER_TURNSTILE_SITE_KEY=1x00000000000000000000AA
DOCKER_TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

The site key is public and is baked into the frontend build. The secret key must
stay only in backend environment variables.

To load demo data automatically on container startup:

```text
DOCKER_SEED_DEMO=True
```

## CI/CD

GitHub Actions has three stages:

- `CI`: checks backend, frontend, and Docker build.
- `Publish Docker Image`: builds the production image and pushes it to GHCR.
- `Deploy`: connects to the server over SSH and updates the Docker Compose
  stack.

Production image:

```text
ghcr.io/chegal-oss/accommodation-rental-service:latest
```

Required GitHub Secrets:

```text
TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
DOCKER_SECRET_KEY
DOCKER_MYSQL_PASSWORD
DOCKER_MYSQL_ROOT_PASSWORD
DEPLOY_HOST
DEPLOY_USER
DEPLOY_SSH_KEY
```

Optional GitHub Secrets:

```text
DOCKER_SUPERUSER_EMAIL
DOCKER_SUPERUSER_PASSWORD
```

Optional GitHub Secrets for private GHCR images:

```text
GHCR_USERNAME
GHCR_READ_TOKEN
```

Optional GitHub Variables:

```text
DEPLOY_PATH=/opt/homerent
DEPLOY_HEALTH_URL=https://chegal.duckdns.org/api/schema/
DOCKER_SUPERUSER_NAME=Admin
DOCKER_SUPERUSER_PHONE=
DOCKER_SUPERUSER_ROLE=landlord
DOCKER_SEED_DEMO=False
```

One-time server setup:

```bash
mkdir -p /opt/homerent
```

The deployment workflow renders `.env.prod` from GitHub Secrets and uploads it
to the server. The generated `.env.prod` file stays on the server and must not be
committed.

The deployment workflow uploads `.env.prod`, `docker-compose.prod.yml`, and
`docker/Caddyfile` to the server, pulls the selected image, and starts the stack:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml pull
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```
