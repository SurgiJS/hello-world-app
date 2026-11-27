# Weather

A weather app built with [SurgiJS](https://github.com/SurgiJS/surgijs) (`@surgijs/core`, `@surgijs/compiler`, `@surgijs/store`) and the public [Open-Meteo](https://open-meteo.com/) API. A plain SPA: no SSR and no backend of its own. It is deployed to GitHub Pages.

## Features

- city search (geocoding API), geolocation and favorite cities;
- current weather, a 24-hour chart, a 7-day forecast and air quality;
- °C / °F switch and a dark theme that follows the system setting;
- the city, favorites and units are kept in `localStorage` through `persist`.

## How it works

All state lives in one `createStore` (`src/lib/store.ts`):

| Field | Kind | Depends on |
| --- | --- | --- |
| `query`, `city`, `favorites`, `units` | sync | |
| `cities` | `remote` | `query` |
| `forecast`, `air` | `remote` | `city` |

Components (`src/components`) are Web Components written in JSX. They read the store through `fromStore` / `fromStatus` from `@surgijs/store/core`. `createRemote` types the `deps`, search debouncing is set with `remote({ debounce })`, and `persist` saves state to `localStorage`.

## Development

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # vitest
npm run build   # tsc + vite build -> dist/
```

## Deployment

The workflow `.github/workflows/deploy.yml` builds the app and publishes `dist/` to GitHub Pages on every push to `main`.
In the repository settings choose Settings, Pages, Source: **GitHub Actions**.

## Data

Weather and air quality data by [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0).
