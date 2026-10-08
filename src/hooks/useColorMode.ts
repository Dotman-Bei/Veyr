import { useCallback, useEffect, useState } from 'react';

type Mode = 'light' | 'dark';
const KEY = 'veyr-theme';

const current = (): Mode =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light';

/** Colour mode lives on <html>; index.html sets it before first paint. */
export function useColorMode() {
  const [mode, setMode] = useState<Mode>(current);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  // Follow the system preference until the user picks a mode explicitly.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem(KEY)) return;
      } catch {
        /* storage unavailable: follow the system */
      }
      setMode(e.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* non-persistent is fine */
      }
      return next;
    });
  }, []);

  return { mode, toggle };
}
