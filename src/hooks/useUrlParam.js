import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

// ---------------------------------------------------------------------------
// useUrlParam — estado sincronizado con un query-param de la URL.
// ---------------------------------------------------------------------------
// Reemplaza useState para filtros y tabs que queremos que sobrevivan a
// refresh y a copiar/pegar de URLs. Por ejemplo: si el usuario filtra por
// mes "Enero" en /admin/reportes, la URL queda
// /admin/reportes?mes=Enero — si hace F5 o comparte el link, el filtro
// se respeta.
//
// API (espejo de useState):
//   const [value, setValue] = useUrlParam('tab', 'generar');
//
// Detalles:
//   - Si el valor actual coincide con `defaultValue`, se OMITE del query
//     string para no ensuciar la URL con el estado por defecto.
//   - El cambio usa `replace: true` en navegación para no llenar el
//     history del navegador con cada click de tab/filtro.
//   - El `serialize` y `deserialize` opcionales permiten usar tipos no
//     string (números, arrays join/split, etc.).
// ---------------------------------------------------------------------------

export function useUrlParam(key, defaultValue = '', options = {}) {
  const {
    serialize = (v) => String(v),
    deserialize = (v) => v,
    replace = true,
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();

  const raw = searchParams.get(key);
  const value = raw == null ? defaultValue : deserialize(raw);

  const setValue = useCallback((next) => {
    setSearchParams((prev) => {
      const copy = new URLSearchParams(prev);
      // Permitir setter función al estilo setState(prevValue => newValue).
      const resolved = typeof next === 'function' ? next(value) : next;
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
