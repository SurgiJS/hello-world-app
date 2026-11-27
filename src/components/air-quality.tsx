import { defineComponent, Match, Switch } from '@surgijs/core';
import { fromStatus, fromStore } from '../lib/bridge';
import { airLevel } from '../lib/weather';

export const AirQuality = () => {
  const city = fromStore((s) => s.city);
  const air = fromStore((s) => s.air);
  const status = fromStatus('air');
  const data = () => {
    const a = air();
    return a && a.cityId === city()?.id ? a : null;
  };
  const level = () => airLevel(data()?.aqi ?? 0);

  return (
    <section class="card">
      <h3 class="card-title">Качество воздуха</h3>
      <Switch>
        <Match when={data()}>
          <p class="aqi">
            <span class={`aqi-badge ${level().tone}`}>{data()?.aqi}</span>
            <strong>{level().label}</strong>
          </p>
          <dl class="facts compact">
            <div>
              <dt>PM2.5</dt>
              <dd>{data()?.pm25} мкг/м³</dd>
            </div>
            <div>
              <dt>PM10</dt>
              <dd>{data()?.pm10} мкг/м³</dd>
            </div>
          </dl>
          <p class="muted small">Европейский индекс EAQI: чем меньше, тем чище воздух.</p>
        </Match>
        <Match when={status().isError}>
          <p class="muted">Данные о воздухе недоступны.</p>
        </Match>
        <Match when={status().status === 'success' || status().status === 'empty'}>
          <p class="muted">Для этой точки данных о качестве воздуха нет.</p>
        </Match>
        <Match when={true}>
          <div class="skeleton line-skeleton"></div>
        </Match>
      </Switch>
    </section>
  );
};

defineComponent('air-quality', AirQuality, undefined, { shadow: false });
