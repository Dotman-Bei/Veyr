import { useEffect, useState } from 'react';

/** True once the page has scrolled past `offset`; scroll events throttled to 50ms. */
export function useScrolled(offset = 0) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let timer: number | null = null;
    const update = () => {
      timer = null;
      setScrolled(window.scrollY > offset);
    };
    const onScroll = () => {
      if (timer === null) timer = window.setTimeout(update, 50);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [offset]);

  return scrolled;
}
