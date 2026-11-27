export type Units = 'metric' | 'imperial';

export interface Condition {
  label: string;
  icon: string;
}

const CONDITIONS: Record<number, Condition> = {
  0: { label: 'Clear', icon: '☀️' },
  1: { label: 'Mostly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Fog', icon: '🌫️' },
  48: { label: 'Rime fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Drizzle', icon: '🌦️' },
  55: { label: 'Heavy drizzle', icon: '🌦️' },
  56: { label: 'Freezing drizzle', icon: '🌧️' },
  57: { label: 'Heavy freezing drizzle', icon: '🌧️' },
  61: { label: 'Light rain', icon: '🌦️' },
  63: { label: 'Rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  66: { label: 'Freezing rain', icon: '🌧️' },
  67: { label: 'Heavy freezing rain', icon: '🌧️' },
  71: { label: 'Light snow', icon: '🌨️' },
  73: { label: 'Snow', icon: '🌨️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  77: { label: 'Snow grains', icon: '❄️' },
  80: { label: 'Light showers', icon: '🌦️' },
  81: { label: 'Showers', icon: '🌧️' },
  82: { label: 'Heavy showers', icon: '⛈️' },
  85: { label: 'Snow showers', icon: '🌨️' },
  86: { label: 'Heavy snow showers', icon: '❄️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm with hail', icon: '⛈️' },
  99: { label: 'Severe thunderstorm with hail', icon: '⛈️' },
};

export function condition(code: number, isDay = true): Condition {
  const c = CONDITIONS[code] ?? { label: 'No data', icon: '❔' };
  return !isDay && code === 0 ? { label: 'Clear night', icon: '🌙' } : c;
}

const convert = (celsius: number, units: Units): number =>
  units === 'imperial' ? (celsius * 9) / 5 + 32 : celsius;

export function temp(celsius: number, units: Units): number {
  return Math.round(convert(celsius, units));
}

export function formatTemp(celsius: number, units: Units): string {
  const v = temp(celsius, units);
  return `${v < 0 ? '−' : ''}${Math.abs(v)}°`;
}

export function formatWind(kmh: number, units: Units): string {
  return units === 'imperial' ? `${Math.round(kmh * 0.621371)} mph` : `${Math.round(kmh)} km/h`;
}

export function formatPrecipitation(mm: number, units: Units): string {
  return units === 'imperial' ? `${(mm / 25.4).toFixed(2)} in` : `${mm.toFixed(1)} mm`;
}

export function formatPressure(hpa: number, units: Units): string {
  return units === 'imperial' ? `${(hpa * 0.02953).toFixed(2)} inHg` : `${Math.round(hpa)} hPa`;
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export function compass(degrees: number): string {
  return COMPASS[Math.round((((degrees % 360) + 360) % 360) / 45) % 8] ?? 'N';
}

export function formatDay(date: string, index: number): string {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

export const timeOf = (iso: string): string => iso.slice(11, 16);

export interface AirLevel {
  label: string;
  tone: 'good' | 'fair' | 'moderate' | 'poor' | 'bad';
}

export function airLevel(aqi: number): AirLevel {
  if (aqi <= 20) return { label: 'Excellent', tone: 'good' };
  if (aqi <= 40) return { label: 'Good', tone: 'fair' };
  if (aqi <= 60) return { label: 'Moderate', tone: 'moderate' };
  if (aqi <= 80) return { label: 'Poor', tone: 'poor' };
  return { label: 'Very poor', tone: 'bad' };
}

export interface ChartPoint {
  x: number;
  y: number;
  value: number;
  rain: number;
}

export interface ChartGeometry {
  points: ChartPoint[];
  line: string;
  area: string;
  barWidth: number;
  baseline: number;
}

export interface ChartInput {
  temperature: number;
  precipitationProbability: number;
}

export const CHART = { width: 720, height: 200, padX: 28, padTop: 28, padBottom: 28 } as const;

export function chartGeometry(hours: readonly ChartInput[], units: Units): ChartGeometry {
  const { width, height, padX, padTop, padBottom } = CHART;
  const baseline = height - padBottom;
  if (hours.length === 0) return { points: [], line: '', area: '', barWidth: 0, baseline };
  const values = hours.map((h) => convert(h.temperature, units));
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const step = hours.length > 1 ? (width - padX * 2) / (hours.length - 1) : 0;
  const points = hours.map((h, i) => ({
    x: padX + i * step,
    y: padTop + (1 - ((values[i] ?? lo) - lo) / span) * (baseline - padTop),
    value: Math.round(values[i] ?? lo),
    rain: h.precipitationProbability,
  }));
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const area = `${line} L${last.x.toFixed(1)},${baseline} L${first.x.toFixed(1)},${baseline} Z`;
  return { points, line, area, barWidth: Math.max(2, step * 0.5), baseline };
}
