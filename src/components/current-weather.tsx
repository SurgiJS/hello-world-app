import { defineComponent, Show } from '@surgijs/core';
import { fromStore } from '../lib/bridge';
import { store, toggleFavorite } from '../lib/store';
import {
  compass,
  condition,
  formatPrecipitation,
  formatPressure,
  formatTemp,
  formatWind,
  timeOf,
} from '../lib/weather';

export const CurrentWeather = () => {
  const forecast = fromStore((s) => s.forecast);
  const city = fromStore((s) => s.city);
  const units = fromStore((s) => s.units);
  const favorites = fromStore((s) => s.favorites);
  const isFavorite = () => favorites().some((f) => f.id === city()?.id);

  return (
    <Show when={forecast()}>
      {(f) => (
        <section class="card current">
          <div class="current-head">
            <div>
              <h2 class="city">{city()?.name}</h2>
              <p class="muted">{[city()?.region, city()?.country].filter(Boolean).join(', ')}</p>
            </div>
            <button
              type="button"
              class={isFavorite() ? 'star on' : 'star'}
              aria-pressed={isFavorite() ? 'true' : 'false'}
              aria-label={isFavorite() ? 'Убрать из избранного' : 'Добавить в избранное'}
              onClick={() => {
                const c = city();
                if (c) toggleFavorite(store, c);
              }}
            >
              {isFavorite() ? '★' : '☆'}
            </button>
          </div>
          <div class="current-main">
            <span class="icon" aria-hidden="true">
              {condition(f.current.code, f.current.isDay).icon}
            </span>
            <span class="temp">{formatTemp(f.current.temperature, units())}</span>
            <div class="summary">
              <strong>{condition(f.current.code, f.current.isDay).label}</strong>
              <span class="muted">Ощущается как {formatTemp(f.current.feelsLike, units())}</span>
              <span class="muted">Местное время {timeOf(f.current.time)}</span>
            </div>
          </div>
          <dl class="facts">
            <div>
              <dt>Ветер</dt>
              <dd>
                {formatWind(f.current.windSpeed, units())}, {compass(f.current.windDirection)}
              </dd>
            </div>
            <div>
              <dt>Влажность</dt>
              <dd>{f.current.humidity}%</dd>
            </div>
            <div>
              <dt>Давление</dt>
              <dd>{formatPressure(f.current.pressure)}</dd>
            </div>
            <div>
              <dt>Осадки</dt>
              <dd>{formatPrecipitation(f.current.precipitation, units())}</dd>
            </div>
          </dl>
        </section>
      )}
    </Show>
  );
};

defineComponent('current-weather', CurrentWeather, undefined, { shadow: false });
