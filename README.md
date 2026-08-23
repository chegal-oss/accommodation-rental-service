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
