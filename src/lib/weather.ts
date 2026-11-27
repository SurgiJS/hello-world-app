export type Units = 'metric' | 'imperial';

export interface Condition {
  label: string;
  icon: string;
}

const CONDITIONS: Record<number, Condition> = {
  0: { label: 'Ясно', icon: '☀️' },
  1: { label: 'Преимущественно ясно', icon: '🌤️' },
  2: { label: 'Переменная облачность', icon: '⛅' },
  3: { label: 'Пасмурно', icon: '☁️' },
  45: { label: 'Туман', icon: '🌫️' },
  48: { label: 'Изморозь', icon: '🌫️' },
  51: { label: 'Слабая морось', icon: '🌦️' },
  53: { label: 'Морось', icon: '🌦️' },
  55: { label: 'Сильная морось', icon: '🌦️' },
  56: { label: 'Ледяная морось', icon: '🌧️' },
  57: { label: 'Сильная ледяная морось', icon: '🌧️' },
  61: { label: 'Слабый дождь', icon: '🌦️' },
  63: { label: 'Дождь', icon: '🌧️' },
  65: { label: 'Сильный дождь', icon: '🌧️' },
  66: { label: 'Ледяной дождь', icon: '🌧️' },
  67: { label: 'Сильный ледяной дождь', icon: '🌧️' },
  71: { label: 'Слабый снег', icon: '🌨️' },
  73: { label: 'Снег', icon: '🌨️' },
  75: { label: 'Сильный снег', icon: '❄️' },
  77: { label: 'Снежные зёрна', icon: '❄️' },
  80: { label: 'Слабый ливень', icon: '🌦️' },
  81: { label: 'Ливень', icon: '🌧️' },
  82: { label: 'Сильный ливень', icon: '⛈️' },
  85: { label: 'Снегопад', icon: '🌨️' },
  86: { label: 'Сильный снегопад', icon: '❄️' },
  95: { label: 'Гроза', icon: '⛈️' },
  96: { label: 'Гроза с градом', icon: '⛈️' },
  99: { label: 'Сильная гроза с градом', icon: '⛈️' },
};

export function condition(code: number, isDay = true): Condition {
  const c = CONDITIONS[code] ?? { label: 'Нет данных', icon: '❔' };
  return !isDay && code === 0 ? { label: 'Ясная ночь', icon: '🌙' } : c;
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
  return units === 'imperial' ? `${Math.round(kmh * 0.621371)} миль/ч` : `${Math.round(kmh)} км/ч`;
}

export function formatPrecipitation(mm: number, units: Units): string {
  return units === 'imperial' ? `${(mm / 25.4).toFixed(2)} дюйм` : `${mm.toFixed(1)} мм`;
}

export function formatPressure(hpa: number): string {
  return `${Math.round(hpa * 0.750062)} мм рт. ст.`;
}

const COMPASS = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];

export function compass(degrees: number): string {
  return COMPASS[Math.round((((degrees % 360) + 360) % 360) / 45) % 8] ?? 'С';
}

export function formatDay(date: string, index: number): string {
  if (index === 0) return 'Сегодня';
  if (index === 1) return 'Завтра';
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('ru-RU', {
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
  if (aqi <= 20) return { label: 'Отлично', tone: 'good' };
  if (aqi <= 40) return { label: 'Хорошо', tone: 'fair' };
  if (aqi <= 60) return { label: 'Умеренно', tone: 'moderate' };
  if (aqi <= 80) return { label: 'Плохо', tone: 'poor' };
  return { label: 'Очень плохо', tone: 'bad' };
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
