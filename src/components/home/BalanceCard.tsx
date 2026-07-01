function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

interface BalanceCardProps {
  totalBalance: number;
  income: number;
  expenses: number;
  wallets: Array<{ id: number; name: string; emoji: string; color: string; balance: number; currency: string }>;
}

export default function BalanceCard({ totalBalance, income, expenses, wallets }: BalanceCardProps) {
  return (
    <div
      className="mx-4 mt-5 rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a1530 0%, #12112a 50%, #0f1528 100%)',
        border: '1px solid rgba(124,106,247,0.3)',
        boxShadow: '0 8px 32px rgba(124,106,247,0.12)',
      }}
    >
      <div className="p-6 pb-4">
        <p className="text-xs font-medium tracking-wider uppercase mb-3" style={{ color: '#5a5870' }}>
          Balance Total
        </p>
        <p className="text-4xl font-bold tracking-tight" style={{ color: '#f1f0ff', fontVariantNumeric: 'tabular-nums' }}>
          {formatCOP(totalBalance)}
        </p>

        <div className="flex gap-4 mt-5">
          <div className="flex-1 rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs" style={{ color: '#22c55e' }}>+</span>
              <span className="text-xs font-medium" style={{ color: '#22c55e' }}>Ingresos</span>
            </div>
            <p className="text-sm font-bold" style={{ color: '#f1f0ff' }}>{formatCOP(income)}</p>
          </div>
          <div className="flex-1 rounded-xl p-3" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs" style={{ color: '#f43f5e' }}>-</span>
              <span className="text-xs font-medium" style={{ color: '#f43f5e' }}>Gastos</span>
            </div>
            <p className="text-sm font-bold" style={{ color: '#f1f0ff' }}>{formatCOP(expenses)}</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-3 text-xs font-medium" style={{ color: '#9896b0', borderTop: '1px solid rgba(124,106,247,0.15)', background: 'rgba(0,0,0,0.2)' }}>
        {wallets.length} billetera{wallets.length !== 1 ? 's' : ''}
      </div>

      <div className="px-4 pb-4 flex flex-col gap-2">
        {wallets.map((w) => (
          <div key={w.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-2.5">
              <span className="text-base">{w.emoji}</span>
              <span className="text-sm font-medium" style={{ color: '#d4d2f0' }}>{w.name}</span>
            </div>
            <span className="text-sm font-semibold" style={{ color: w.balance >= 0 ? '#f1f0ff' : '#f43f5e' }}>
              {formatCOP(w.balance)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
