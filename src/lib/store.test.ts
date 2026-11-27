import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseForecast } from './api';
import { createWeatherStore, DEFAULT_CITY, POPULAR_CITIES } from './store';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

const rawForecast = {
  current: {
    time: '2026-01-01T10:20',
    temperature_2m: 1,
    apparent_temperature: -2,
    relative_humidity_2m: 80,
    precipitation: 0,
    weather_code: 3,
    is_day: 1,
    wind_speed_10m: 5,
    wind_direction_10m: 180,
    surface_pressure: 1010,
  },
  hourly: {
    time: ['2026-01-01T09:00', '2026-01-01T10:00', '2026-01-01T11:00', '2026-01-01T17:00', '2026-01-01T18:00'],
    temperature_2m: [0, 1, 2, 3, 4],
    precipitation_probability: [0, null, 20, 30, 40],
    weather_code: [0, 1, 2, 3, 0],
  },
  daily: {
    time: ['2026-01-01'],
    weather_code: [3],
    temperature_2m_max: [4],
    temperature_2m_min: [-1],
    precipitation_sum: [0],
    sunrise: ['2026-01-01T08:00'],
    sunset: ['2026-01-01T16:30'],
    uv_index_max: [null],
  },
};

describe('parseForecast', () => {
  it('starts at the current hour and marks night hours', () => {
    const f = parseForecast(7, rawForecast);
    expect(f.cityId).toBe(7);
    expect(f.hourly.map((h) => h.time.slice(11))).toEqual(['10:00', '11:00', '17:00', '18:00']);
    expect(f.hourly[0]!.precipitationProbability).toBe(0);
    expect(f.hourly.map((h) => h.isDay)).toEqual([true, true, false, false]);
    expect(f.daily[0]!.uvIndex).toBe(0);
  });
});

describe('weather store', () => {
  const calls: URL[] = [];

  beforeEach(() => {
    calls.length = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: URL | string) => {
        const url = new URL(String(input));
        calls.push(url);
        if (url.hostname.startsWith('geocoding')) {
          const name = url.searchParams.get('name');
          return name === 'zzz'
            ? json({ generationtime_ms: 1 })
            : json({ results: [{ id: 1, name: 'Берлин', admin1: 'Берлин', country: 'Германия', latitude: 52.5, longitude: 13.4 }] });
        }
        if (url.hostname.startsWith('air-quality')) return json({ current: { european_aqi: 10, pm2_5: 1, pm10: 2 } });
        return json(rawForecast);
      }),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  const settle = () => new Promise((r) => setTimeout(r, 10));

  it('loads the forecast for the selected city and refetches when it changes', async () => {
    const store = createWeatherStore();
    const stop = store.subscribe((s) => s.forecast, () => {});
    await settle();
    expect(store.get((s) => s.forecast)?.cityId).toBe(DEFAULT_CITY.id);

    store.set('city', POPULAR_CITIES[1]!);
    await settle();
    expect(store.get((s) => s.forecast)?.cityId).toBe(POPULAR_CITIES[1]!.id);
    expect(calls.filter((u) => u.hostname === 'api.open-meteo.com')).toHaveLength(2);
    stop();
  });

  it('does not refetch the forecast on unrelated writes', async () => {
    const store = createWeatherStore();
    const stop = store.subscribe((s) => s.forecast, () => {});
    await settle();
    store.set('units', 'imperial');
    store.set('query', 'abc');
    await settle();
    expect(calls.filter((u) => u.hostname === 'api.open-meteo.com')).toHaveLength(1);
    stop();
  });

  it('skips the network for short queries and reports empty results', async () => {
    const store = createWeatherStore();
    const stop = store.subscribe((s) => s.cities, () => {});
    await settle();
    expect(calls.filter((u) => u.hostname.startsWith('geocoding'))).toHaveLength(0);

    store.set('query', 'zzz');
    await settle();
    expect(store.status('cities').status).toBe('empty');

    store.set('query', 'берлин');
    await settle();
    expect(store.get((s) => s.cities)?.[0]).toMatchObject({ name: 'Берлин', region: undefined });
    stop();
  });

  it('keeps stale data and flags the error when a refetch fails', async () => {
    const store = createWeatherStore(0);
    const stop = store.subscribe((s) => s.forecast, () => {});
    await settle();
    vi.mocked(fetch).mockImplementation(async () => json({ reason: 'boom' }, 500));
    store.set('city', POPULAR_CITIES[2]!);
    await vi.waitFor(() => expect(store.status('forecast').isError).toBe(true), { timeout: 3000 });
    expect(store.status('forecast').httpStatus).toBe(500);
    expect(store.get((s) => s.forecast)?.cityId).toBe(DEFAULT_CITY.id);
    stop();
  });
});
