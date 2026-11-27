import { action, createRemote, createStore, persist, type Get } from '@surgijs/store';
import {
  loadAirQuality,
  loadForecast,
  searchCities,
  type City,
} from './api';
import type { Units } from './weather';

export const DEFAULT_CITY: City = {
  id: 703448,
  name: 'Kyiv',
  country: 'Ukraine',
  latitude: 50.45466,
  longitude: 30.5238,
  timezone: 'Europe/Kyiv',
};

export const POPULAR_CITIES: City[] = [
  DEFAULT_CITY,
  { id: 2950159, name: 'Berlin', country: 'Germany', latitude: 52.52437, longitude: 13.41053, timezone: 'Europe/Berlin' },
  { id: 2643743, name: 'London', country: 'United Kingdom', latitude: 51.50853, longitude: -0.12574, timezone: 'Europe/London' },
  { id: 5128581, name: 'New York', country: 'United States', latitude: 40.71427, longitude: -74.00597, timezone: 'America/New_York' },
  { id: 1850147, name: 'Tokyo', country: 'Japan', latitude: 35.6895, longitude: 139.69171, timezone: 'Asia/Tokyo' },
  { id: 2147714, name: 'Sydney', country: 'Australia', latitude: -33.86785, longitude: 151.20732, timezone: 'Australia/Sydney' },
];

export const MIN_QUERY = 2;

interface State {
  query: string;
  city: City | null;
  favorites: City[];
  units: Units;
}

export function createWeatherStore(retryDelay = 1000) {
  const remote = createRemote<State>();

  const store = createStore(
    {
      query: '',
      city: DEFAULT_CITY as City | null,
      favorites: [] as City[],
      units: 'metric' as Units,

      cities: remote({
        deps: (get) => get.query.trim(),
        debounce: 250,
        staleTime: 10 * 60_000,
        fetch: async (_get, { deps: q, signal, report }) =>
          q.length < MIN_QUERY ? [] : searchCities(q, signal, report),
      }),

      forecast: remote({
        deps: (get) => get.city,
        staleTime: 5 * 60_000,
        fetch: async (_get, { deps: city, signal, report }) => (city ? loadForecast(city, signal, report) : null),
      }),

      air: remote({
        deps: (get) => get.city,
        staleTime: 10 * 60_000,
        fetch: async (_get, { deps: city, signal, report }) => (city ? loadAirQuality(city, signal, report) : null),
      }),
    },
    { retry: 1, retryDelay },
  );

  persist(store, { name: 'surgi-weather', keys: ['city', 'favorites', 'units'] });

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
