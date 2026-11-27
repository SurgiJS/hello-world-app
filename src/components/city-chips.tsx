import { defineComponent, For } from '@surgijs/core';
import { fromStore } from '../lib/bridge';
import { POPULAR_CITIES, selectCity, store } from '../lib/store';

export const CityChips = () => {
  const favorites = fromStore((s) => s.favorites);
  const city = fromStore((s) => s.city);
  const hasFavorites = () => favorites().length > 0;
  const shown = () => (hasFavorites() ? favorites() : POPULAR_CITIES);

  return (
    <nav class="chips" aria-label={hasFavorites() ? 'Избранные города' : 'Популярные города'}>
      <span class="chips-title">{hasFavorites() ? '★ Избранное' : 'Популярные'}</span>
      <For each={shown()} by={(c) => c.id}>
        {(c) => (
          <button
            type="button"
            class={city()?.id === c.id ? 'chip active' : 'chip'}
            onClick={() => selectCity(store, c)}
          >
            {c.name}
          </button>
        )}
      </For>
    </nav>
  );
};

defineComponent('city-chips', CityChips, undefined, { shadow: false });
