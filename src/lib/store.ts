import { action, createStore, remote, type Get } from '@surgijs/store';
import {
  loadAirQuality,
  loadForecast,
  searchCities,
  type AirQuality,
  type City,
  type Forecast,
} from './api';
import { load, save } from './storage';
import type { Units } from './weather';

export const DEFAULT_CITY: City = {
  id: 703448,
  name: 'Киев',
  country: 'Украина',
  latitude: 50.45466,
  longitude: 30.5238,
  timezone: 'Europe/Kyiv',
};

export const POPULAR_CITIES: City[] = [
  DEFAULT_CITY,
  { id: 2950159, name: 'Берлин', country: 'Германия', latitude: 52.52437, longitude: 13.41053, timezone: 'Europe/Berlin' },
  { id: 2643743, name: 'Лондон', country: 'Великобритания', latitude: 51.50853, longitude: -0.12574, timezone: 'Europe/London' },
  { id: 5128581, name: 'Нью-Йорк', country: 'США', latitude: 40.71427, longitude: -74.00597, timezone: 'America/New_York' },
  { id: 1850147, name: 'Токио', country: 'Япония', latitude: 35.6895, longitude: 139.69171, timezone: 'Asia/Tokyo' },
  { id: 2147714, name: 'Сидней', country: 'Австралия', latitude: -33.86785, longitude: 151.20732, timezone: 'Australia/Sydney' },
];

export const MIN_QUERY = 2;

export function createWeatherStore(retryDelay = 1000) {
  const retry = { retry: 1, retryDelay };
  const store = createStore(
    {
      query: '',
      city: load<City | null>('city', DEFAULT_CITY),
      favorites: load<City[]>('favorites', []),
      units: load<Units>('units', 'metric'),

      cities: remote<City[]>({
        deps: (get) => (get('query') as string).trim(),
        staleTime: 10 * 60_000,
        ...retry,
        fetch: async (_get, { deps, signal, report }) => {
          const q = deps as string;
          return q.length < MIN_QUERY ? [] : searchCities(q, signal, report);
        },
      }),

      forecast: remote<Forecast | null>({
        deps: (get) => get('city') as City | null,
        staleTime: 5 * 60_000,
        ...retry,
        fetch: async (_get, { deps, signal, report }) => {
          const city = deps as City | null;
          return city ? loadForecast(city, signal, report) : null;
        },
      }),

      air: remote<AirQuality | null>({
        deps: (get) => get('city') as City | null,
        staleTime: 10 * 60_000,
        ...retry,
        fetch: async (_get, { deps, signal, report }) => {
          const city = deps as City | null;
          return city ? loadAirQuality(city, signal, report) : null;
        },
      }),
    },
  );

  store.subscribe((s) => s.city, (city) => save('city', city));
  store.subscribe((s) => s.favorites, (list) => save('favorites', list));
  store.subscribe((s) => s.units, (units) => save('units', units));

  return store;
}

export type WeatherStore = ReturnType<typeof createWeatherStore>;

export const selectCity = action((_get, set, city: City) => {
  set({ city, query: '' });
});

export const toggleFavorite = action((get: Get<Record<string, any>>, set, city: City) => {
  const list = get('favorites') as City[];
  set('favorites', list.some((c) => c.id === city.id) ? list.filter((c) => c.id !== city.id) : [...list, city]);
});

export const toggleUnits = action((get, set) => {
  set('units', get('units') === 'metric' ? 'imperial' : 'metric');
});

export const store = createWeatherStore();
