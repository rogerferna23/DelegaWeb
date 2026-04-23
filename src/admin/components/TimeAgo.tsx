import { useState, useEffect } from 'react';

/**
 * Muestra un tiempo relativo ("hace 3m", "hace 2h") y lo actualiza
 * cada minuto de forma aislada.
 *
 * Al vivir en su propio componente, el setInterval ya no provoca
 * que AdminLayout completo se repinte cada 60 segundos.
 */
export default function TimeAgo({ dateStr, className = '' }: { dateStr: string; className?: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const diff = now - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);

  let label;
  if (m < 1)   label = 'ahora';
  else if (m < 60) label = `hace ${m}m`;
  else if (h < 24) label = `hace ${h}h`;
  else             label = `hace ${d}d`;

  return <span className={className}>{label}</span>;
}
