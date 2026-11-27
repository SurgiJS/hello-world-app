import { createMemo, defineComponent, Match, Show, Switch } from '@surgijs/core';
import { fromStatus, fromStore } from '../lib/bridge';
import { store } from '../lib/store';
import './current-weather';
import './hourly-chart';
import './daily-forecast';
import './air-quality';

export const ForecastView = () => {
  const city = fromStore((s) => s.city);
  const forecast = fromStore((s) => s.forecast);
  const status = fromStatus('forecast');

  const ready = createMemo(() => {
    const f = forecast();
    return f != null && f.cityId === city()?.id;
  });
  const refresh = () => {
    void store.refetch('forecast');
    void store.refetch('air');
  };

  return (
    <main class="view" aria-busy={status().isFetching ? 'true' : 'false'}>
      <Switch>
        <Match when={!city()}>
          <p class="card empty">Выберите город, чтобы увидеть прогноз.</p>
        </Match>
        <Match when={ready()}>
          <current-weather></current-weather>
          <hourly-chart></hourly-chart>
          <div class="grid">
            <daily-forecast></daily-forecast>
            <air-quality></air-quality>
          </div>
          <div class="refresh">
            <Show when={status().isFetching}>
              <span class="muted">Обновляю…</span>
            </Show>
            <Show when={status().isError}>
              <span class="muted error">Не удалось обновить, показаны сохранённые данные</span>
            </Show>
            <button type="button" class="pill" onClick={refresh}>
              ↻ Обновить
            </button>
          </div>
        </Match>
        <Match when={status().isError}>
          <div class="card empty">
            <p>
              Не удалось загрузить прогноз
              {status().httpStatus ? ` (HTTP ${status().httpStatus})` : ''}.
            </p>
            <button type="button" class="pill" onClick={refresh}>
              Повторить
            </button>
          </div>
        </Match>
        <Match when={true}>
          <div class="card skeleton" aria-label="Загрузка прогноза"></div>
          <div class="card skeleton short"></div>
        </Match>
      </Switch>
    </main>
  );
};

defineComponent('forecast-view', ForecastView, undefined, { shadow: false });
