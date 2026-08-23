# HomeRent Frontend

React + Vite + TypeScript frontend for the HomeRent property rental API.

## Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- TanStack Query
- React Router
- i18next

## Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Default API URL:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

## Commands

```bash
npm install
npm run lint
npm run build
npm run dev
```

## Single Port Mode

For Django-served production assets, build the frontend:

```bash
npm run build
```

The production build uses:

```env
VITE_API_BASE_URL=/api/v1
```

Django serves the SPA from the same host:

```text
/        -> React app
/api/    -> DRF API and Swagger
/admin/  -> Django Admin
```
