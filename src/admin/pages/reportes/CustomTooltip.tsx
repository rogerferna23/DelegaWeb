interface PayloadEntry { dataKey: string; color: string; name: string; value: unknown }
interface CustomTooltipProps { active?: boolean; payload?: PayloadEntry[]; label?: string }

export default function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-cardbg border border-white/10 rounded-lg px-3 py-2 text-xs space-y-1">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.dataKey} style={{ color: p.color }}>{p.name}: ${Number(p.value).toLocaleString()}</p>
        ))}
      </div>
    );
  }
  return null;
}
