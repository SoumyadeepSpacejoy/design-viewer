# Spacejoy Admin (design-viewer)

Admin dashboard and design management portal, built with
[SolidStart](https://start.solidjs.com) (Solid + Vinxi) and Tailwind CSS v4.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build into `.output/` |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |

## Layout

```
src/
  app.tsx            root: Router + MetaProvider + ThemeProvider + AuthGuard
  app.css            design tokens, component classes, animations (Tailwind v4)
  entry-client.tsx   client hydration
  entry-server.tsx   HTML shell + no-flash theme script
  routes/            file-based routes; (dashboard) is a layout group
  components/        UI components
  lib/               types + API clients (clientApi, assetApi, designApi)
```

Auth is a bearer token in `localStorage`; `AuthGuard` gates every route and
redirects to `/login`. API calls go straight to the Spacejoy APIs from the
browser, so most routes render client-side. `/design/:id` is the one route that
loads its data on the server via `query` + `createAsync`.
