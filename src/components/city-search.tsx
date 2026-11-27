import { createMemo, defineComponent, For, Show, useState } from '@surgijs/core';
import type { City } from '../lib/api';
import { fromStatus, fromStore } from '@surgijs/store/core';
import { MIN_QUERY, selectCity, store } from '../lib/store';

export const CitySearch = () => {
  const [text, setText] = useState('');
  const query = fromStore(store, (s) => s.query);
  const cities = fromStatus(store, 'cities');
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const open = createMemo(() => query().trim().length >= MIN_QUERY);
  const list = () => cities().data ?? [];

  const onInput = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    setText(value);
    store.set('query', value);
  };

  const reset = () => {
    setText('');
    store.set('query', '');
  };

  const choose = (city: City) => {
    selectCity(store, city);
    setText('');
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') reset();
    if (e.key === 'Enter') {
      const first = list()[0];
      if (first) choose(first);
    }
  };

  const locate = () => {
    setLocationError('');
    if (!navigator.geolocation) return setLocationError('Geolocation is not available in this browser');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        choose({
          id: -Math.abs(Math.round(coords.latitude * 100) * 100_000 + Math.round(coords.longitude * 100)) - 1,
          name: 'My location',
          country: `${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)}`,
          latitude: coords.latitude,
          longitude: coords.longitude,
          timezone: 'auto',
        });
      },
      () => {
        setLocating(false);
        setLocationError('Could not determine your location');
      },
      { timeout: 8000 },
    );
  };

  return (
    <div class="search">
      <div class="search-row">
        <input
          class="search-input"
          type="search"
          placeholder="Search for a city…"
          autocomplete="off"
          aria-label="City search"
          value={text()}
          onInput={onInput}
          onKeyDown={onKeyDown}
        />
        <button type="button" class="pill" disabled={locating()} onClick={locate}>
          {locating() ? 'Locating…' : '📍 My location'}
        </button>
      </div>
      <Show when={locationError()}>
        <p class="hint error">{locationError()}</p>
      </Show>
      <Show when={open()}>
        <ul class="results" role="listbox">
          <Show when={cities().status === 'pending' && list().length === 0}>
            <li class="result muted">Searching…</li>
          </Show>
          <Show when={cities().status === 'empty'}>
            <li class="result muted">No cities found</li>
          </Show>
          <Show when={cities().status === 'err'}>
            <li class="result muted">Search is unavailable, please try again</li>
          </Show>
          <For each={list()} by={(c) => c.id}>
            {(city) => (
              <li class="result" role="option" onClick={() => choose(city)}>
                <strong>{city.name}</strong>
                <span class="muted">{[city.region, city.country].filter(Boolean).join(', ')}</span>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
};

defineComponent('city-search', CitySearch, undefined, { shadow: false });
