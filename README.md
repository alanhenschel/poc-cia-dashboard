# CIA Dashboards — M2 Frontend

Next.js (App Router, TypeScript) UI for the CIA Dashboards feature: a customizable widget grid,
dashboard create/edit, global filters, and reusable charts.

> **There is no backend.** The app is entirely self-contained against a typed **mock service layer**
> (`src/services/`). It behaves like the eventual `cia-backend` (realistic latency, error/retry, stale
> data, pagination) but runs in-browser.

## Run it with Docker (recommended)

From this directory:

```bash
docker compose up -d --build
```

Then open **http://localhost:3100**.

- The app listens on port **3000** inside the container, published to **3100** on your host.
- `docker compose down` stops it. `docker compose logs -f` tails logs.

Prefer plain Docker?

```bash
docker build -t cia-dashboards .
docker run --rm -p 3100:3000 cia-dashboards
# open http://localhost:3100
```

## Where does "my" data live? (important)

The mock backend persists to your **browser's `localStorage`**, not to the container or any database.
That means:

- Dashboards/charts you create, layouts you save, and charts you fork **survive a page reload** — but
  only in the **same browser profile** you created them in.
- A **different browser, a different machine, or an incognito/private window starts fresh** from the
  seed data (it has its own empty `localStorage`).
- Restarting or rebuilding the container does **not** affect your data — it was never stored server-side.

To reset to the original seed data, clear this site's `localStorage` (DevTools → Application → Local
Storage → delete the `cia-dashboards.mock.v1` key) and reload.

## Live deployment

Deployed to Vercel, password-protected: **https://frontend-lake-ten-46.vercel.app**

No environment variables or backend are required — same mocked, in-browser data flow as Docker/local dev.
The `localStorage` caveat above applies identically here: each visitor's data lives in their own browser.

To redeploy after changes (from this directory):
```bash
npx vercel --prod
```

## Local development (optional)

```bash
npm install
npm run dev      # http://localhost:3000, hot reload
```

Other scripts:

```bash
npm run build    # production build (standalone output)
npm start        # serve the production build
npm run lint     # ESLint
npm test         # Vitest unit suite
```

## Tech stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · react-grid-layout · Recharts ·
TanStack Query · react-hook-form + zod · Zustand · Vitest + React Testing Library.
