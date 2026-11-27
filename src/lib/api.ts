import { fromResponse, type RemoteReport } from '@surgijs/store';

export interface City {
  id: number;
  name: string;
  region?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitation: number;
  code: number;
  isDay: boolean;
  windSpeed: number;
  windDirection: number;
  pressure: number;
}

export interface HourPoint {
  time: string;
  temperature: number;
  precipitationProbability: number;
  code: number;
  isDay: boolean;
}

export interface DayPoint {
  date: string;
  code: number;
  max: number;
  min: number;
  precipitationSum: number;
  sunrise: string;
  sunset: string;
  uvIndex: number;
}

export interface Forecast {
  current: CurrentWeather;
  hourly: HourPoint[];
  daily: DayPoint[];
}

export interface AirQuality {
  aqi: number;
  pm25: number;
  pm10: number;
}

interface GeoResult {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

interface ForecastResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    is_day: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    surface_pressure: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: (number | null)[];
    weather_code: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: (number | null)[];
  };
}

interface AirResponse {
  current?: { european_aqi: number | null; pm2_5: number | null; pm10: number | null };
}

type Report = (info: RemoteReport) => void;

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const AIR_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

export const HOURS_SHOWN = 24;

export async function searchCities(name: string, signal: AbortSignal, report?: Report): Promise<City[]> {
  const url = new URL(GEO_URL);
  url.search = new URLSearchParams({ name, count: '6', language: 'en', format: 'json' }).toString();
  const data = await fromResponse<{ results?: GeoResult[] }>(await fetch(url, { signal }), { report });
  return (data?.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    region: r.admin1 && r.admin1 !== r.name ? r.admin1 : undefined,
    country: r.country ?? '',
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone ?? 'auto',
  }));
}

export async function loadForecast(city: City, signal: AbortSignal, report?: Report): Promise<Forecast> {
  const url = new URL(FORECAST_URL);
  url.search = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,is_day,wind_speed_10m,wind_direction_10m,surface_pressure',
    hourly: 'temperature_2m,precipitation_probability,weather_code',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset,uv_index_max',
    timezone: 'auto',
    forecast_days: '7',
  }).toString();
  const data = await fromResponse<ForecastResponse>(await fetch(url, { signal }), { report });
  return parseForecast(data);
}

export async function loadAirQuality(city: City, signal: AbortSignal, report?: Report): Promise<AirQuality | null> {
  const url = new URL(AIR_URL);
  url.search = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: 'european_aqi,pm2_5,pm10',
  }).toString();
  const data = await fromResponse<AirResponse>(await fetch(url, { signal }), { report });
  const c = data?.current;
  if (!c || c.european_aqi == null || c.pm2_5 == null || c.pm10 == null) return null;
  return { aqi: c.european_aqi, pm25: c.pm2_5, pm10: c.pm10 };
}

export function parseForecast(d: ForecastResponse): Forecast {
  const c = d.current;
  const hourPrefix = c.time.slice(0, 13);
  const from = Math.max(0, d.hourly.time.findIndex((t) => t >= hourPrefix));
  const sun = new Map(d.daily.time.map((date, i) => [date, [d.daily.sunrise[i] ?? '', d.daily.sunset[i] ?? ''] as const]));
  const isDayAt = (time: string): boolean => {
    const [rise, set] = sun.get(time.slice(0, 10)) ?? ['', ''];
    return !rise || !set || (time >= rise.slice(0, 13) && time < set.slice(0, 13) + ':59');
  };
  const hourly: HourPoint[] = d.hourly.time.slice(from, from + HOURS_SHOWN).map((time, i) => ({
    time,
    temperature: d.hourly.temperature_2m[from + i] ?? 0,
    precipitationProbability: d.hourly.precipitation_probability[from + i] ?? 0,
    code: d.hourly.weather_code[from + i] ?? 0,
    isDay: isDayAt(time),
  }));
  const daily: DayPoint[] = d.daily.time.map((date, i) => ({
    date,
    code: d.daily.weather_code[i] ?? 0,
    max: d.daily.temperature_2m_max[i] ?? 0,
    min: d.daily.temperature_2m_min[i] ?? 0,
    precipitationSum: d.daily.precipitation_sum[i] ?? 0,
    sunrise: d.daily.sunrise[i] ?? '',
    sunset: d.daily.sunset[i] ?? '',
    uvIndex: d.daily.uv_index_max[i] ?? 0,
  }));
  return {
    current: {
      time: c.time,
      temperature: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      precipitation: c.precipitation,
      code: c.weather_code,
      isDay: c.is_day === 1,
      windSpeed: c.wind_speed_10m,
      windDirection: c.wind_direction_10m,
      pressure: c.surface_pressure,
    },
    hourly,
    daily,
  };
}
