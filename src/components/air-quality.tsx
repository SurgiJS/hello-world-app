import { defineComponent, Match, Switch } from '@surgijs/core';
import { fromStatus } from '@surgijs/store/core';
import { store } from '../lib/store';
import { airLevel } from '../lib/weather';

export const AirQuality = () => {
  const status = fromStatus(store, 'air');
  const data = () => status().data;
  const level = () => airLevel(data()?.aqi ?? 0);

  return (
    <section class="card">
      <h3 class="card-title">Air quality</h3>
      <Switch>
        <Match when={data()}>
          <p class="aqi">
            <span class={`aqi-badge ${level().tone}`}>{data()?.aqi}</span>
            <strong>{level().label}</strong>
          </p>
          <dl class="facts compact">
            <div>
              <dt>PM2.5</dt>
              <dd>{data()?.pm25} µg/m³</dd>
            </div>
            <div>
              <dt>PM10</dt>
              <dd>{data()?.pm10} µg/m³</dd>
            </div>
          </dl>
          <p class="muted small">European Air Quality Index (EAQI): the lower, the cleaner the air.</p>
        </Match>
        <Match when={status().isError}>
          <p class="muted">Air quality data is unavailable.</p>
        </Match>
        <Match when={status().status === 'success' || status().status === 'empty'}>
          <p class="muted">No air quality data for this location.</p>
        </Match>
        <Match when={true}>
          <div class="skeleton line-skeleton"></div>
        </Match>
      </Switch>
    </section>
  );
};

defineComponent('air-quality', AirQuality, undefined, { shadow: false });
