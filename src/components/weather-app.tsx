import { defineComponent } from '@surgijs/core';
import { fromStore } from '@surgijs/store/core';
import { toggleUnits, store } from '../lib/store';
import './city-search';
import './city-chips';
import './forecast-view';

export const WeatherApp = () => {
  const units = fromStore(store, (s) => s.units);
  return (
    <div class="shell">
      <header class="top">
        <h1 class="brand">
          <span aria-hidden="true">⛅</span> Погода
        </h1>
        <button
          type="button"
          class="pill"
          aria-label="Переключить единицы измерения"
          onClick={() => toggleUnits(store)}
        >
          {units() === 'metric' ? '°C · км/ч' : '°F · миль/ч'}
        </button>
      </header>
      <city-search></city-search>
      <city-chips></city-chips>
      <forecast-view></forecast-view>
      <footer class="foot">
        Данные:{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener">
          Open-Meteo.com
        </a>{' '}
        · UI на <a href="https://github.com/SurgiJS/surgijs" target="_blank" rel="noopener">SurgiJS</a>
      </footer>
    </div>
  );
};

defineComponent('weather-app', WeatherApp, undefined, { shadow: false });
