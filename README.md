# Погода

Погодное приложение на [SurgiJS](https://github.com/SurgiJS/surgijs) (`@surgijs/core`, `@surgijs/compiler`, `@surgijs/store`) и публичном API [Open-Meteo](https://open-meteo.com/). Чистый SPA без SSR и без собственного бэкенда, деплой на GitHub Pages.

## Возможности

- поиск города (geocoding API), геолокация, избранные города;
- текущая погода, график на 24 часа, прогноз на 7 дней, качество воздуха;
- переключение °C / °F, тёмная тема по системным настройкам;
- состояние (город, избранное, единицы) хранится в `localStorage` через `persist`.

## Как устроено

Всё состояние живёт в одном `createStore` (`src/lib/store.ts`):

| Поле | Тип | Зависит от |
| --- | --- | --- |
| `query`, `city`, `favorites`, `units` | sync | |
| `cities` | `remote` | `query` |
| `forecast`, `air` | `remote` | `city` |

Компоненты (`src/components`) это Web Components на JSX, которые читают store через `fromStore` / `fromStatus` из `@surgijs/store/core`. Типизированные `deps` дает `createRemote`, дебаунс поиска задан в `remote({ debounce })`, сохранение в `localStorage` делает `persist`.

## Разработка

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # vitest
npm run build   # tsc + vite build -> dist/
```

## Деплой

Workflow `.github/workflows/deploy.yml` собирает и публикует `dist/` на GitHub Pages при пуше в `main`.
В настройках репозитория: Settings, Pages, Source: **GitHub Actions**.
