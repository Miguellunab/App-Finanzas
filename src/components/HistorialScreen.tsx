import { useState, useEffect, useCallback } from 'react';
import AppShell from './layout/AppShell';

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
  walletEmoji?: string | null;
  aiGenerated?: boolean;
}

const typeColors = { income: '#22c55e', expense: '#f43f5e', transfer: '#3b82f6' };
const typeSymbols = { income: '+', expense: '-', transfer: '<>' };

function formatCOP(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function HistorialScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100' });
    if (filter !== 'all') params.set('type', filter);
    const txRes = await fetch(`/api/transactions?${params}`);
    const txData = await txRes.json();
    setTransactions(txData.data ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = transactions.filter(tx =>
    !search ||
    tx.description.toLowerCase().includes(search.toLowerCase()) ||
    tx.categoryName?.toLowerCase().includes(search.toLowerCase()) ||
    tx.walletName?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc: Record<string, Transaction[]>, tx) => {
    (acc[tx.date] ??= []).push(tx);
    return acc;
  }, {});

  const handleDelete = async (id: number) => {
    await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
    showToast('Eliminada');
    fetchAll();
  };

  return (
    <AppShell currentPath="/historial" title="Historial">
      <div className="pb-8">
        <div className="sticky top-0 z-10 px-4 pt-4 pb-3" style={{ background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(6px)' }}>
          <div className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-3" style={{ background: '#111118', border: '1px solid #2a2a38' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: '#f1f0ff', fontFamily: 'inherit' }}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {(['all', 'expense', 'income', 'transfer'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: filter === f ? (f === 'all' ? '#7c6af7' : typeColors[f]) : '#18181f',
                  color: filter === f ? 'white' : '#9896b0',
                  border: `1px solid ${filter === f ? 'transparent' : '#2a2a38'}`,
                  cursor: 'pointer',
                }}
              >
                {f === 'all' ? 'Todos' : f === 'income' ? 'Ingresos' : f === 'expense' ? 'Gastos' : 'Transferencias'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="px-4 flex flex-col gap-3">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-sm" style={{ color: '#9896b0' }}>Sin resultados</p>
          </div>
        ) : (
          Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, txs]) => (
            <div key={date} className="mb-1">
              <p className="px-5 py-2 text-xs font-semibold" style={{ color: '#5a5870' }}>{formatDate(date)}</p>
              {txs.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 mx-4 px-4 py-3.5 rounded-2xl mb-1 group" style={{ background: '#111118', border: '1px solid #1a1a22' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: `${typeColors[tx.type]}15` }}>
                    {tx.categoryEmoji ?? typeSymbols[tx.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#f1f0ff' }}>{tx.description || tx.categoryName || tx.type}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs" style={{ color: '#5a5870' }}>{tx.walletEmoji} {tx.walletName}</span>
                      {tx.aiGenerated && <span className="text-xs px-1.5 rounded" style={{ background: 'rgba(124,106,247,0.1)', color: '#7c6af7' }}>IA</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: typeColors[tx.type] }}>
                      {typeSymbols[tx.type]}{formatCOP(tx.amount, tx.currency)}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(tx.id)} className="ml-1 p-2 rounded-lg" style={{ color: '#f43f5e', background: 'rgba(244,63,94,0.1)', border: 'none', cursor: 'pointer' }} aria-label="Eliminar">
                    x
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[100] px-5 py-3 rounded-2xl text-sm font-medium" style={{ transform: 'translateX(-50%)', background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}
    </AppShell>
  );
}
