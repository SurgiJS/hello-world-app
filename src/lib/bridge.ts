import { createSignal, onCleanup, type Accessor } from '@surgijs/core';
import type { RemoteData, RemoteKeys, RemoteMeta, Store, StoreState } from '@surgijs/store';
import { store } from './store';

type Def = typeof store extends Store<infer D> ? D : never;

export function fromStore<T>(selector: (state: StoreState<Def>) => T): Accessor<T> {
  const [value, setValue] = createSignal(store.get(selector));
  onCleanup(store.subscribe(selector, (next) => setValue(() => next), { fireImmediately: true }));
  return value;
}

export function fromStatus<K extends RemoteKeys<Def>>(key: K): Accessor<RemoteMeta<RemoteData<Def, K>>> {
  const [meta, setMeta] = createSignal(store.status(key));
  onCleanup(store.subscribe(() => store.status(key), (next) => setMeta(() => next), { fireImmediately: true }));
  return meta;
}
