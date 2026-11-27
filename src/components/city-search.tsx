import { createMemo, defineComponent, For, Show, useState } from '@surgijs/core';
import type { City } from '../lib/api';
import { fromStatus, fromStore } from '../lib/bridge';
import { MIN_QUERY, selectCity, store } from '../lib/store';

const DEBOUNCE_MS = 250;

export const CitySearch = () => {
  const [text, setText] = useState('');
  const query = fromStore((s) => s.query);
  const cities = fromStatus('cities');
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  let timer: ReturnType<typeof setTimeout> | undefined;

  const open = createMemo(() => query().trim().length >= MIN_QUERY);
  const list = () => cities().data ?? [];

  const onInput = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    setText(value);
    clearTimeout(timer);
    timer = setTimeout(() => store.set('query', value), DEBOUNCE_MS);
  };

  const reset = () => {
    clearTimeout(timer);
    setText('');
    store.set('query', '');
  };

  const choose = (city: City) => {
    selectCity(store, city);
    setText('');
    clearTimeout(timer);
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
    if (!navigator.geolocation) return setLocationError('Геолокация недоступна в этом браузере');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        choose({
          id: -Math.abs(Math.round(coords.latitude * 100) * 100_000 + Math.round(coords.longitude * 100)) - 1,
          name: 'Моё местоположение',
          country: `${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)}`,
          latitude: coords.latitude,
          longitude: coords.longitude,
          timezone: 'auto',
        });
      },
      () => {
        setLocating(false);
        setLocationError('Не удалось определить местоположение');
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
          placeholder="Найти город…"
          autocomplete="off"
          aria-label="Поиск города"
          value={text()}
          onInput={onInput}
          onKeyDown={onKeyDown}
        />
        <button type="button" class="pill" disabled={locating()} onClick={locate}>
          {locating() ? 'Ищу…' : '📍 Где я'}
        </button>
      </div>
      <Show when={locationError()}>
        <p class="hint error">{locationError()}</p>
      </Show>
      <Show when={open()}>
        <ul class="results" role="listbox">
          <Show when={cities().status === 'pending' && list().length === 0}>
            <li class="result muted">Ищу…</li>
          </Show>
          <Show when={cities().status === 'empty'}>
            <li class="result muted">Ничего не найдено</li>
          </Show>
          <Show when={cities().status === 'err'}>
            <li class="result muted">Поиск недоступен, попробуйте ещё раз</li>
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
