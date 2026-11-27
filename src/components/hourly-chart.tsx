import { createMemo, defineComponent, For } from '@surgijs/core';
import { fromStore } from '@surgijs/store/core';
import { store } from '../lib/store';
import { CHART, chartGeometry, condition, formatTemp, timeOf } from '../lib/weather';

export const HourlyChart = () => {
  const forecast = fromStore(store, (s) => s.forecast);
  const units = fromStore(store, (s) => s.units);
  const hours = () => forecast()?.hourly ?? [];
  const geo = createMemo(() => chartGeometry(hours(), units()));
  const labelled = createMemo(() => {
    const g = geo();
    return hours()
      .map((h, i) => ({ h, p: g.points[i]! }))
      .filter((_, i) => i % 3 === 0);
  });

  return (
    <section class="card">
      <h3 class="card-title">Next 24 hours</h3>
      <svg
        class="chart"
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        role="img"
        aria-label="Temperature chart for the next 24 hours"
      >
        <For each={geo().points} by={(p, i) => `${i}:${p.rain}`}>
          {(p) => (
            <rect
              class="bar"
              x={p.x - geo().barWidth / 2}
              y={geo().baseline - (p.rain / 100) * 36}
              width={geo().barWidth}
              height={(p.rain / 100) * 36}
              rx="2"
            />
          )}
        </For>
        <path class="area" d={geo().area} />
        <path class="line" d={geo().line} />
        <For each={labelled()} by={(l) => `${l.h.time}:${l.p.value}`}>
          {(l) => (
            <g>
              <circle class="dot" cx={l.p.x} cy={l.p.y} r="3.5" />
              <text class="val" x={l.p.x} y={l.p.y - 10} text-anchor="middle">
                {l.p.value}°
              </text>
              <text class="tick" x={l.p.x} y={CHART.height - 8} text-anchor="middle">
                {timeOf(l.h.time)}
              </text>
            </g>
          )}
        </For>
      </svg>
      <ul class="strip">
        <For each={hours().filter((_, i) => i % 3 === 0)} by={(h) => h.time}>
          {(h) => (
            <li>
              <span class="muted">{timeOf(h.time)}</span>
              <span aria-hidden="true">{condition(h.code, h.isDay).icon}</span>
              <strong>{formatTemp(h.temperature, units())}</strong>
              <span class="muted">{h.precipitationProbability}%</span>
            </li>
          )}
        </For>
      </ul>
    </section>
  );
};

defineComponent('hourly-chart', HourlyChart, undefined, { shadow: false });
