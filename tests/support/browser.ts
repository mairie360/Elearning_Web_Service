// `window` minimal pour le code client exécuté sous Node : localStorage en mémoire et navigations enregistrées.

export class MemoryStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
  get length() { return this.values.size; }
}

export type FakeWindow = {
  localStorage: MemoryStorage;
  location: {
    assign: (url: string) => void;
    assigned: string[];
    href: string;
    readonly search: string;
  };
  history: { state: unknown; replaceState: (state: unknown, unused: string, url: string) => void };
};

export function installWindow(): FakeWindow {
  let currentUrl = new URL('https://elearning.test.example/');
  const location = {
    assigned: [] as string[],
    assign(url: string) { location.assigned.push(url); },
    get href() { return currentUrl.href; },
    set href(url: string) { currentUrl = new URL(url, currentUrl); },
    get search() { return currentUrl.search; },
  };
  const history = {
    state: null as unknown,
    replaceState(state: unknown, _unused: string, url: string) {
      history.state = state;
      location.href = url;
    },
  };
  const fake: FakeWindow = { localStorage: new MemoryStorage(), location, history };
  (globalThis as { window?: unknown }).window = fake;
  return fake;
}

export function removeWindow(): void {
  delete (globalThis as { window?: unknown }).window;
}
