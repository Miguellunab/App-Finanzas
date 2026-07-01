interface DayData {
  date: string;
  income: number;
  expense: number;
}

export default function MiniChart({ data }: { data: DayData[] }) {
  if (!data?.length) {
    return (
      <div className="mx-4 mt-4 rounded-2xl p-5" style={{ background: '#111118', border: '1px solid #1e1e28' }}>
        <p className="text-xs font-semibold mb-4" style={{ color: '#9896b0' }}>Actividad reciente</p>
        <div className="flex items-center justify-center h-20" style={{ color: '#5a5870', fontSize: '0.8rem' }}>Sin datos aun</div>
      </div>
    );
  }

  const max = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);

  return (
    <div className="mx-4 mt-4 rounded-2xl p-5" style={{ background: '#111118', border: '1px solid #1e1e28' }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold" style={{ color: '#9896b0' }}>Ultimos 30 dias</p>
        <div className="flex items-center gap-3 text-xs">
          <span style={{ color: '#22c55e' }}>+ Ingresos</span>
          <span style={{ color: '#f43f5e' }}>- Gastos</span>
        </div>
      </div>
      <div className="flex items-end gap-1 h-24">
        {data.slice(-30).map((d) => (
          <div key={d.date} className="flex-1 flex flex-col justify-end gap-0.5 min-w-0" title={d.date}>
            <div style={{ height: `${Math.max(2, (d.income / max) * 88)}px`, background: '#22c55e', borderRadius: '4px 4px 0 0', opacity: d.income ? 0.9 : 0.15 }} />
            <div style={{ height: `${Math.max(2, (d.expense / max) * 88)}px`, background: '#f43f5e', borderRadius: '0 0 4px 4px', opacity: d.expense ? 0.9 : 0.15 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
