interface Transaction {
  id: number;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  description: string;
  date: string;
  categoryName?: string | null;
  categoryEmoji?: string | null;
  walletName?: string | null;
  aiGenerated?: boolean;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  onDelete?: (id: number) => void;
}

function formatCOP(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `$${amount.toLocaleString('es-CO')}`;
  }
}

function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff < 7) return `Hace ${diff} dias`;
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

const typeConfig = {
  income: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', symbol: '+', label: 'Ingreso' },
  expense: { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', symbol: '-', label: 'Gasto' },
  transfer: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', symbol: '<>', label: 'Transfer.' },
};

function TransactionIcon({ tx }: { tx: Transaction }) {
  const text = `${tx.description} ${tx.categoryName ?? ''}`.toLowerCase();
  if (text.includes('deuda') || text.includes('credito') || text.includes('tarjeta')) return <CardIcon />;
  if (text.includes('comida') || text.includes('mercado') || text.includes('empanada')) return <CartIcon />;
  if (tx.type === 'income') return <IncomeIcon />;
  if (tx.type === 'transfer') return <TransferIcon />;
  return <ExpenseIcon />;
}

function CardIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>; }
function CartIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/><path d="M3 4h2l3 12h10l2-8H7"/></svg>; }
function IncomeIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>; }
function ExpenseIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>; }
function TransferIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 7h11l-3-3"/><path d="M17 17H6l3 3"/></svg>; }

export default function RecentTransactions({ transactions, onDelete }: RecentTransactionsProps) {
  if (!transactions.length) {
    return (
      <div className="mx-4 mt-4 rounded-2xl p-6 text-center" style={{ background: '#111118', border: '1px solid #1e1e28' }}>
        <p className="text-sm font-medium" style={{ color: '#9896b0' }}>Sin transacciones aun</p>
        <p className="text-xs mt-1" style={{ color: '#5a5870' }}>Usa el microfono o escribe para probar</p>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-4 rounded-2xl overflow-hidden" style={{ background: '#111118', border: '1px solid #1e1e28' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1e1e28' }}>
        <p className="text-xs font-semibold" style={{ color: '#9896b0' }}>Ultimos movimientos</p>
        <a href="/historial" className="text-xs font-medium no-underline" style={{ color: '#7c6af7' }}>Ver todo -&gt;</a>
      </div>

      <div className="flex flex-col">
        {transactions.map((tx, i) => {
          const cfg = typeConfig[tx.type];
          return (
            <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5 group" style={{ borderBottom: i < transactions.length - 1 ? '1px solid #1a1a22' : 'none' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                {tx.categoryEmoji ? <span className="text-lg">{tx.categoryEmoji}</span> : <TransactionIcon tx={tx} />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#f1f0ff' }}>{tx.description || tx.categoryName || cfg.label}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs" style={{ color: '#5a5870' }}>{formatRelativeDate(tx.date)}</span>
                  {tx.categoryName && <span className="text-xs" style={{ color: '#5a5870' }}>- {tx.categoryName}</span>}
                  {tx.aiGenerated && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(124,106,247,0.15)', color: '#7c6af7' }}>IA</span>}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.symbol}{formatCOP(tx.amount, tx.currency)}</p>
                {tx.walletName && <p className="text-xs mt-0.5" style={{ color: '#5a5870' }}>{tx.walletName}</p>}
              </div>

              {onDelete && (
                <button onClick={() => onDelete(tx.id)} className="ml-1 p-2 rounded-lg" style={{ color: '#f43f5e', background: 'rgba(244,63,94,0.15)' }} aria-label="Eliminar">
                  x
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
