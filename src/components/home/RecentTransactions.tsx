import { motion } from 'framer-motion';

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
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
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
  if (diff < 7) return `Hace ${diff} días`;
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

const typeConfig = {
  income: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', symbol: '+', label: 'Ingreso' },
  expense: { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', symbol: '-', label: 'Gasto' },
  transfer: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', symbol: '⇄', label: 'Transfer.' },
};

export default function RecentTransactions({ transactions, onDelete }: RecentTransactionsProps) {
  if (!transactions.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-4 mt-4 rounded-2xl p-6 text-center"
        style={{ background: '#111118', border: '1px solid #1e1e28' }}
      >
        <p className="text-2xl mb-2">💸</p>
        <p className="text-sm font-medium" style={{ color: '#9896b0' }}>Sin transacciones aún</p>
        <p className="text-xs mt-1" style={{ color: '#5a5870' }}>Usa el botón de micrófono o escribe para empezar</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mx-4 mt-4 rounded-2xl overflow-hidden"
      style={{ background: '#111118', border: '1px solid #1e1e28' }}
    >
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1e1e28' }}>
        <p className="text-xs font-semibold" style={{ color: '#9896b0' }}>Últimos movimientos</p>
        <a href="/historial" className="text-xs font-medium no-underline" style={{ color: '#7c6af7' }}>
          Ver todo →
        </a>
      </div>

      <div className="flex flex-col">
        {transactions.map((tx, i) => {
          const cfg = typeConfig[tx.type];
          return (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3 px-5 py-3.5 group"
              style={{
                borderBottom: i < transactions.length - 1 ? '1px solid #1a1a22' : 'none',
              }}
            >
              {/* Icono de categoría */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: cfg.bg }}>
                {tx.categoryEmoji ?? (tx.type === 'income' ? '💰' : tx.type === 'transfer' ? '🔄' : '💸')}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#f1f0ff' }}>
                  {tx.description || tx.categoryName || cfg.label}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs" style={{ color: '#5a5870' }}>{formatRelativeDate(tx.date)}</span>
                  {tx.categoryName && (
                    <>
                      <span style={{ color: '#2a2a38' }}>·</span>
                      <span className="text-xs" style={{ color: '#5a5870' }}>{tx.categoryName}</span>
                    </>
                  )}
                  {tx.aiGenerated && (
                    <>
                      <span style={{ color: '#2a2a38' }}>·</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(124,106,247,0.15)', color: '#7c6af7' }}>IA</span>
                    </>
                  )}
                </div>
              </div>

              {/* Monto */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold" style={{ color: cfg.color }}>
                  {cfg.symbol}{formatCOP(tx.amount, tx.currency)}
                </p>
                {tx.walletName && (
                  <p className="text-xs mt-0.5" style={{ color: '#5a5870' }}>{tx.walletName}</p>
                )}
              </div>

              {/* Delete (swipe-style, visible on hover/press) */}
              {onDelete && (
                <button
                  onClick={() => onDelete(tx.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-1.5 rounded-lg"
                  style={{ color: '#f43f5e', background: 'rgba(244,63,94,0.1)' }}
                  aria-label="Eliminar"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                  </svg>
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
