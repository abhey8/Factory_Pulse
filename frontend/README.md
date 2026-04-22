# FactoryPulse AI Frontend

React/Vite dashboard for the factory productivity backend.

The dashboard consumes live backend data through `src/app/services/api.ts` and can run either through Vite during development or as static assets served by Express after a production build.

## Local Development

From the repository root:

```bash
npm run frontend:install
npm run dev:backend
npm run dev:frontend
```

The Vite dev server runs on http://localhost:5173 and proxies `/api` to the backend on http://localhost:3000.

## API Base URL

Copy `frontend/.env.example` to `frontend/.env` only if you need to override the default:

```text
VITE_API_BASE_URL="/api"
```

Keep `/api` when using the included proxy or the Express-served production build.
