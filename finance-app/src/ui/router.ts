import { useEffect, useState } from 'react';
import { afterHistorySettled } from './modalStack';

const read = () => (window.location.hash.replace(/^#/, '') || '/home');

export function useRoute(): string {
  const [route, setRoute] = useState(read());
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
/** Push a new screen (back button returns to the previous one). */
export const go = (path: string) => afterHistorySettled(() => { window.location.hash = path; });
/** Switch without adding history (used for top-level tabs). */
export const replace = (path: string) => afterHistorySettled(() => { window.location.replace(`#${path}`); });
export const back = () => window.history.back();
