import { useEffect, useState } from 'react';

function bindMediaQuery(query: MediaQueryList, listener: () => void) {
  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }

  query.addListener(listener);
  return () => query.removeListener(listener);
}

export default function useLiteMode() {
  const [liteMode, setLiteMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const queries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(hover: none) and (pointer: coarse)'),
      window.matchMedia('(max-width: 768px)'),
    ];

    const update = () => {
      setLiteMode(queries.some((query) => query.matches));
    };

    update();

    const cleanups = queries.map((query) => bindMediaQuery(query, update));
    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return liteMode;
}
