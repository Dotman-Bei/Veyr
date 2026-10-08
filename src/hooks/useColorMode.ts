import { useCallback, useEffect, useSyncExternalStore } from 'react';

type Mode = 'light' | 'dark';
const KEY = 'veyr-theme';

// The <html> class is the single source of truth (index.html sets it before
// first paint), so every component using this hook stays in sync.
const getMode = (): Mode => (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

function setMode(mode: Mode) {
  document.documentElement.classList.toggle('dark', mode === 'dark');
}

function storedMode(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function useColorMode() {
  const mode = useSyncExternalStore(subscribe, getMode, () => 'light' as Mode);

  // Follow the system preference until the user picks a mode explicitly.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      if (!storedMode()) setMode(e.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    const next: Mode = getMode() === 'dark' ? 'light' : 'dark';
    setMode(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* non-persistent is fine */
    }
  }, []);

  return { mode, toggle };
}
