import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

interface UseUrlParamOptions<T> {
  serialize?:   (v: T) => string;
  deserialize?: (v: string) => T;
  replace?:     boolean;
}

/**
 * Estado sincronizado con un query-param de la URL.
 * API espejo de useState: const [value, setValue] = useUrlParam('tab', 'generar');
 */
export function useUrlParam<T = string>(
  key: string,
  defaultValue: T,
  options: UseUrlParamOptions<T> = {},
): [T, (next: T | ((prev: T) => T)) => void] {
  const {
    serialize   = (v: T) => String(v),
    deserialize = (v: string) => v as unknown as T,
    replace     = true,
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();

  const raw   = searchParams.get(key);
  const value: T = raw == null ? defaultValue : deserialize(raw);

  const setValue = useCallback((next: T | ((prev: T) => T)) => {
    setSearchParams((prev) => {
      const copy     = new URLSearchParams(prev);
      const resolved = typeof next === 'function'
        ? (next as (p: T) => T)(value)
        : next;

      if (resolved == null || resolved === '' || resolved === defaultValue) {
        copy.delete(key);
      } else {
        copy.set(key, serialize(resolved));
      }
      return copy;
    }, { replace });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, defaultValue, replace, serialize, setSearchParams]);

  return [value, setValue];
}

export default useUrlParam;
