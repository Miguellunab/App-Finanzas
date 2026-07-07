import { useState, useEffect, useCallback } from 'react';
import AppShell from './layout/AppShell';

interface Transaction {
  id: number;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  description: string;
  date: string;
  expenseKind?: 'fixed' | 'variable' | 'mismatch' | null;
  walletId: number;
  walletDestinationId?: number | null;
  walletName?: string | null;
  walletEmoji?: string | null;
  aiGenerated?: boolean;
}

interface Wallet {
  id: number;
  name: string;
  emoji: string;
  type?: string;
}

const typeColors = { income: '#22c55e', expense: '#f43f5e', transfer: '#3b82f6' };
const typeSymbols = { income: '+', expense: '-', transfer: '<>' };
const kindLabels = { fixed: 'Fijo', variable: 'Variable', mismatch: 'Descuadre' };

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
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [search, setSearch] = useState('');
  const [walletId, setWalletId] = useState('');
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100' });
    if (filter !== 'all') params.set('type', filter);
    if (walletId) params.set('walletId', walletId);
    const [txRes, walletsRes] = await Promise.all([fetch(`/api/transactions?${params}`), fetch('/api/wallets')]);
    const [txData, walletsData] = await Promise.all([txRes.json(), walletsRes.json()]);
    setTransactions(txData.data ?? []);
    setWallets(walletsData.data ?? []);
    setLoading(false);
  }, [filter, walletId]);

  useEffect(() => {
    setWalletId(new URLSearchParams(window.location.search).get('walletId') ?? '');
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = transactions.filter(tx =>
    !search ||
    tx.description.toLowerCase().includes(search.toLowerCase()) ||
    tx.expenseKind?.toLowerCase().includes(search.toLowerCase()) ||
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

  const handleSave = async () => {
    if (!editing) return;
    const res = await fetch('/api/transactions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    if (!res.ok) {
      const data = await res.json();
      showToast(data.error ?? 'Error al editar');
      return;
    }
    setEditing(null);
    showToast('Editada');
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
          {walletId && (
            <button onClick={() => { setWalletId(''); history.replaceState(null, '', '/historial'); }} className="mt-2 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#9896b0' }}>
              Limpiar billetera
            </button>
          )}
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
              {txs.map(tx => {
                const kind = tx.expenseKind ? kindLabels[tx.expenseKind] : null;
                return (
                <div key={tx.id} className="flex items-center gap-3 mx-4 px-4 py-3.5 rounded-2xl mb-1 group" style={{ background: '#111118', border: '1px solid #1a1a22' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: `${typeColors[tx.type]}15` }}>
                    {typeSymbols[tx.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#f1f0ff' }}>{tx.description || tx.type}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs" style={{ color: '#5a5870' }}>{tx.walletEmoji} {tx.walletName}</span>
                      {kind && <span className="text-xs" style={{ color: '#5a5870' }}>- {kind}</span>}
                      {tx.aiGenerated && <span className="text-xs px-1.5 rounded" style={{ background: 'rgba(124,106,247,0.1)', color: '#7c6af7' }}>IA</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: typeColors[tx.type] }}>
                      {typeSymbols[tx.type]}{formatCOP(tx.amount, tx.currency)}
                    </p>
                  </div>
                  <button onClick={() => setEditing(tx)} className="ml-1 p-2 rounded-lg" style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.1)', border: 'none', cursor: 'pointer' }} aria-label="Editar">
                    editar
                  </button>
                  <button onClick={() => handleDelete(tx.id)} className="ml-1 p-2 rounded-lg" style={{ color: '#f43f5e', background: 'rgba(244,63,94,0.1)', border: 'none', cursor: 'pointer' }} aria-label="Eliminar">
                    x
                  </button>
                </div>
              );
              })}
            </div>
          ))
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[100] px-5 py-3 rounded-2xl text-sm font-medium" style={{ transform: 'translateX(-50%)', background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}

      {editing && (
        <>
          <button className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.7)', border: 0 }} onClick={() => setEditing(null)} aria-label="Cerrar" />
          <div className="fixed inset-0 z-50 flex items-end justify-center pb-[5%] px-4 pointer-events-none">
            <div className="w-full rounded-3xl p-5 pointer-events-auto" style={{ maxWidth: '440px', background: '#111118', border: '1px solid #2a2a38' }}>
              <p className="text-sm font-semibold mb-4" style={{ color: '#f1f0ff' }}>Editar movimiento</p>
              <div className="flex flex-col gap-3">
                <input value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} placeholder="Descripcion" className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff' }} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={editing.amount} onChange={e => setEditing({ ...editing, amount: parseFloat(e.target.value || '0') })} className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff' }} />
                  <input type="date" value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff' }} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['expense', 'income', 'transfer'] as const).map(type => (
                    <button key={type} onClick={() => setEditing({ ...editing, type })} className="rounded-xl py-2.5 text-xs font-medium" style={{ background: editing.type === type ? `${typeColors[type]}20` : '#18181f', border: `1px solid ${editing.type === type ? typeColors[type] : '#2a2a38'}`, color: editing.type === type ? typeColors[type] : '#9896b0' }}>
                      {type === 'expense' ? 'Gasto' : type === 'income' ? 'Ingreso' : 'Transf.'}
                    </button>
                  ))}
                </div>
                {editing.type === 'expense' && (
                  <div className="grid grid-cols-3 gap-2">
                    {(['fixed', 'variable', 'mismatch'] as const).map(kind => (
                      <button key={kind} onClick={() => setEditing({ ...editing, expenseKind: kind })} className="rounded-xl py-2.5 text-xs font-medium" style={{ background: editing.expenseKind === kind ? 'rgba(124,106,247,0.2)' : '#18181f', border: `1px solid ${editing.expenseKind === kind ? '#7c6af7' : '#2a2a38'}`, color: editing.expenseKind === kind ? '#f1f0ff' : '#9896b0' }}>
                        {kindLabels[kind]}
                      </button>
                    ))}
                  </div>
                )}
                <select value={editing.walletId} onChange={e => setEditing({ ...editing, walletId: parseInt(e.target.value) })} className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff' }}>
                  {wallets.filter(w => w.type !== 'vault').map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                {editing.type === 'transfer' && (
                  <select value={editing.walletDestinationId ?? ''} onChange={e => setEditing({ ...editing, walletDestinationId: parseInt(e.target.value) })} className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff' }}>
                    <option value="">Destino</option>
                    {wallets.filter(w => w.type !== 'vault' && w.id !== editing.walletId).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                )}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setEditing(null)} className="flex-1 py-3 rounded-2xl text-sm font-medium" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#9896b0' }}>Cancelar</button>
                <button onClick={handleSave} className="flex-1 py-3 rounded-2xl text-sm font-semibold" style={{ background: '#7c6af7', border: 'none', color: 'white' }}>Guardar</button>
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
