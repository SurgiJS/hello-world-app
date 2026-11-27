import { createMemo, defineComponent, For } from '@surgijs/core';
import { fromStore } from '@surgijs/store/core';
import { store } from '../lib/store';
import { condition, formatDay, formatPrecipitation, formatTemp } from '../lib/weather';

export const DailyForecast = () => {
  const forecast = fromStore(store, (s) => s.forecast);
  const units = fromStore(store, (s) => s.units);
  const days = () => forecast()?.daily ?? [];
  const range = createMemo(() => {
    const all = days();
    return {
      lo: Math.min(...all.map((d) => d.min)),
      hi: Math.max(...all.map((d) => d.max)),
    };
  });
  const bar = (min: number, max: number) => {
    const { lo, hi } = range();
    const span = hi - lo || 1;
    return `left:${((min - lo) / span) * 100}%;width:${Math.max(6, ((max - min) / span) * 100)}%`;
  };

  return (
    <section class="card">
      <h3 class="card-title">7-day forecast</h3>
      <ul class="days">
        <For each={days()} by={(d) => d.date}>
          {(d, i) => (
            <li class="day">
              <span class="day-name">{formatDay(d.date, i())}</span>
              <span class="day-icon" title={condition(d.code).label}>
                {condition(d.code).icon}
              </span>
              <span class="muted rain">{d.precipitationSum > 0 ? formatPrecipitation(d.precipitationSum, units()) : ''}</span>
              <span class="lo">{formatTemp(d.min, units())}</span>
              <span class="range">
                <i style={bar(d.min, d.max)}></i>
              </span>
              <span class="hi">{formatTemp(d.max, units())}</span>
            </li>
          )}
        </For>
      </ul>
    </section>
  );
};

defineComponent('daily-forecast', DailyForecast, undefined, { shadow: false });
