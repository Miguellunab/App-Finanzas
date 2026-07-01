function formatCOP(n: number, currency = 'COP') {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

interface Wallet {
  id: number;
  name: string;
  emoji: string;
  color: string;
  balance: number;
  currency: string;
  includeInBalance?: boolean;
  type?: string;
}

interface BalanceCardProps {
  totalBalance: number;
  income: number;
  expenses: number;
  wallets: Wallet[];
  onRefresh?: () => Promise<void>;
}

export default function BalanceCard({ totalBalance, income, expenses, wallets, onRefresh }: BalanceCardProps) {
  const toggleBalance = async (w: Wallet) => {
    await fetch('/api/wallets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: w.id, includeInBalance: !w.includeInBalance }),
    });
    await onRefresh?.();
  };

  return (
    <div className="mx-4 mt-5 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1530 0%, #12112a 50%, #0f1528 100%)', border: '1px solid rgba(124,106,247,0.3)', boxShadow: '0 8px 32px rgba(124,106,247,0.12)' }}>
      <div className="p-6 pb-4">
        <p className="text-xs font-medium tracking-wider uppercase mb-3" style={{ color: '#5a5870' }}>Balance Total</p>
        <p className="text-4xl font-bold tracking-tight" style={{ color: '#f1f0ff', fontVariantNumeric: 'tabular-nums' }}>{formatCOP(totalBalance)}</p>

        <div className="flex gap-4 mt-5">
          <div className="flex-1 rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div className="flex items-center gap-1.5 mb-1"><span className="text-xs" style={{ color: '#22c55e' }}>+</span><span className="text-xs font-medium" style={{ color: '#22c55e' }}>Ingresos</span></div>
            <p className="text-sm font-bold" style={{ color: '#f1f0ff' }}>{formatCOP(income)}</p>
          </div>
          <div className="flex-1 rounded-xl p-3" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
            <div className="flex items-center gap-1.5 mb-1"><span className="text-xs" style={{ color: '#f43f5e' }}>-</span><span className="text-xs font-medium" style={{ color: '#f43f5e' }}>Gastos</span></div>
            <p className="text-sm font-bold" style={{ color: '#f1f0ff' }}>{formatCOP(expenses)}</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-3 text-xs font-medium" style={{ color: '#9896b0', borderTop: '1px solid rgba(124,106,247,0.15)', background: 'rgba(0,0,0,0.2)' }}>
        {wallets.length} billetera{wallets.length !== 1 ? 's' : ''}
      </div>

      <div className="px-4 pb-4 flex flex-col gap-2">
        {wallets.map((w) => {
          const visible = w.includeInBalance !== false;
          return (
            <div key={w.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', opacity: visible ? 1 : 0.55 }}>
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base">{w.emoji}</span>
                <div className="min-w-0">
                  <span className="text-sm font-medium block truncate" style={{ color: '#d4d2f0' }}>{w.name}</span>
                  {w.type === 'pocket' && <span className="text-[10px]" style={{ color: '#7c6af7' }}>Bolsillo</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold whitespace-nowrap" style={{ color: w.balance >= 0 ? '#f1f0ff' : '#f43f5e' }}>{formatCOP(w.balance, w.currency)}</span>
                <button onClick={() => toggleBalance(w)} className="text-[10px] px-2 py-1 rounded-lg" style={{ background: visible ? 'rgba(34,197,94,0.12)' : 'rgba(244,63,94,0.12)', border: '1px solid #2a2a38', color: visible ? '#22c55e' : '#f43f5e' }}>
                  {visible ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
