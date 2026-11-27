import { describe, expect, it } from 'vitest';
import { airLevel, chartGeometry, compass, condition, formatTemp, formatWind, temp } from './weather';

describe('units', () => {
  it('converts and rounds temperature', () => {
    expect(temp(0, 'imperial')).toBe(32);
    expect(temp(-0.4, 'metric')).toBe(-0);
    expect(formatTemp(-3.2, 'metric')).toBe('−3°');
    expect(formatTemp(21.6, 'metric')).toBe('22°');
  });

  it('formats wind', () => {
    expect(formatWind(10, 'metric')).toBe('10 км/ч');
    expect(formatWind(10, 'imperial')).toBe('6 миль/ч');
  });

  it('maps degrees to a compass point', () => {
    expect(compass(0)).toBe('С');
    expect(compass(90)).toBe('В');
    expect(compass(359)).toBe('С');
    expect(compass(-90)).toBe('З');
  });
});

describe('conditions', () => {
  it('falls back for unknown codes and shows a moon at night', () => {
    expect(condition(999).label).toBe('Нет данных');
    expect(condition(0, false).icon).toBe('🌙');
    expect(condition(0, true).icon).toBe('☀️');
  });

  it('grades air quality', () => {
    expect(airLevel(10).tone).toBe('good');
    expect(airLevel(55).tone).toBe('moderate');
    expect(airLevel(120).tone).toBe('bad');
  });
});

describe('chartGeometry', () => {
  it('is empty without data', () => {
    expect(chartGeometry([], 'metric').points).toEqual([]);
  });

  it('puts the warmest point on top and spans the width', () => {
    const g = chartGeometry(
      [
        { temperature: 0, precipitationProbability: 0 },
        { temperature: 10, precipitationProbability: 50 },
        { temperature: 5, precipitationProbability: 0 },
      ],
      'metric',
    );
    const [a, b, c] = g.points;
    expect(b!.y).toBeLessThan(c!.y);
    expect(c!.y).toBeLessThan(a!.y);
    expect(a!.x).toBeLessThan(c!.x);
    expect(g.line.startsWith('M')).toBe(true);
    expect(g.area.endsWith('Z')).toBe(true);
  });

  it('does not divide by zero on a flat series', () => {
    const g = chartGeometry(
      [
        { temperature: 3, precipitationProbability: 0 },
        { temperature: 3, precipitationProbability: 0 },
      ],
      'metric',
    );
    expect(g.points.every((p) => Number.isFinite(p.y))).toBe(true);
  });
});
