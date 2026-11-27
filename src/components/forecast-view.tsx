import { createMemo, defineComponent, Match, Show, Switch } from '@surgijs/core';
import { fromStatus, fromStore } from '@surgijs/store/core';
import { store } from '../lib/store';
import './current-weather';
import './hourly-chart';
import './daily-forecast';
import './air-quality';

export const ForecastView = () => {
  const city = fromStore(store, (s) => s.city);
  const status = fromStatus(store, 'forecast');
  const ready = createMemo(() => status().data != null);
  const refresh = () => {
    void store.refetch('forecast');
    void store.refetch('air');
  };

  return (
    <main class="view" aria-busy={status().isFetching ? 'true' : 'false'}>
      <Switch>
        <Match when={!city()}>
          <p class="card empty">Choose a city to see the forecast.</p>
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
              <span class="muted">Updating…</span>
            </Show>
            <Show when={status().isError}>
              <span class="muted error">Could not update, showing saved data</span>
            </Show>
            <button type="button" class="pill" onClick={refresh}>
              ↻ Refresh
            </button>
          </div>
        </Match>
        <Match when={status().isError}>
          <div class="card empty">
            <p>
              Could not load the forecast
              {status().httpStatus ? ` (HTTP ${status().httpStatus})` : ''}.
            </p>
            <button type="button" class="pill" onClick={refresh}>
              Retry
            </button>
          </div>
        </Match>
        <Match when={true}>
          <div class="card skeleton" aria-label="Loading forecast"></div>
          <div class="card skeleton short"></div>
        </Match>
      </Switch>
    </main>
  );
};

defineComponent('forecast-view', ForecastView, undefined, { shadow: false });
