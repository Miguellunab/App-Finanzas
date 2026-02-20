import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from './layout/AppShell';
import AIModal from './input/AIModal';
import TextInput from './input/TextInput';

interface Transaction {
  id: number;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  description: string;
  date: string;
  categoryName?: string | null;
  categoryEmoji?: string | null;
  categoryColor?: string | null;
  walletName?: string | null;
  walletEmoji?: string | null;
  aiGenerated?: boolean;
}

const typeColors = { income: '#22c55e', expense: '#f43f5e', transfer: '#3b82f6' };
const typeSymbols = { income: '+', expense: '-', transfer: '⇄' };

function formatCOP(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
  } catch { return `$${amount}`; }
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function HistorialScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [search, setSearch] = useState('');
  const [interpretation, setInterpretation] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [interpreting, setInterpreting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100' });
    if (filter !== 'all') params.set('type', filter);
    const [txRes, wRes, cRes] = await Promise.all([
      fetch(`/api/transactions?${params}`),
      fetch('/api/wallets'),
      fetch('/api/categories'),
    ]);
    const [txData, wData, cData] = await Promise.all([txRes.json(), wRes.json(), cRes.json()]);
    setTransactions(txData.data ?? []);
    setWallets(wData.data ?? []);
    setCategories(cData.data ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = transactions.filter(tx =>
    !search || tx.description.toLowerCase().includes(search.toLowerCase()) ||
    (tx.categoryName?.toLowerCase().includes(search.toLowerCase())) ||
    (tx.walletName?.toLowerCase().includes(search.toLowerCase()))
  );

  // Agrupar por fecha
  const grouped = filtered.reduce((acc: Record<string, Transaction[]>, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {});

  const handleDelete = async (id: number) => {
    await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
    showToast('Eliminada');
    fetchAll();
  };

  const handleText = async (text: string) => {
    setInterpreting(true);
    try {
      const res = await fetch('/api/ai/interpret', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInterpretation(data.data);
      setModalOpen(true);
    } catch (e: any) {
      showToast('Error: ' + e.message);
    } finally { setInterpreting(false); }
  };

  const handleConfirm = async (txData: any) => {
    await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(txData) });
    setModalOpen(false);
    setInterpretation(null);
    showToast('✓ Guardado');
    fetchAll();
  };

  return (
    <AppShell currentPath="/historial" title="Historial">
      <div className="pb-8">
        {/* Barra de búsqueda y filtros */}
        <div className="sticky top-0 z-10 px-4 pt-4 pb-3" style={{ background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(12px)' }}>
          {/* Búsqueda */}
          <div className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-3"
            style={{ background: '#111118', border: '1px solid #2a2a38' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5a5870" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: '#f1f0ff', fontFamily: 'inherit' }}
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {(['all', 'expense', 'income', 'transfer'] as const).map(f => (
              <button key={f}
                onClick={() => setFilter(f)}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: filter === f ? (f === 'all' ? '#7c6af7' : typeColors[f] ?? '#7c6af7') : '#18181f',
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

        {/* Lista agrupada por fecha */}
        {loading ? (
          <div className="px-4 flex flex-col gap-3">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-sm" style={{ color: '#9896b0' }}>Sin resultados</p>
          </div>
        ) : (
          Object.entries(grouped)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, txs]) => (
              <div key={date} className="mb-1">
                <p className="px-5 py-2 text-xs font-semibold" style={{ color: '#5a5870' }}>
                  {formatDate(date)}
                </p>
                {txs.map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 mx-4 px-4 py-3.5 rounded-2xl mb-1 group"
                    style={{ background: '#111118', border: '1px solid #1a1a22' }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                      style={{ background: `${typeColors[tx.type]}15` }}>
                      {tx.categoryEmoji ?? (tx.type === 'income' ? '💰' : '💸')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#f1f0ff' }}>
                        {tx.description || tx.categoryName || tx.type}
                      </p>
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
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="opacity-0 group-hover:opacity-100 ml-1 p-2 rounded-lg"
                      style={{ color: '#f43f5e', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      </svg>
                    </button>
                  </motion.div>
                ))}
              </div>
            ))
        )}

        {/* Input rápido */}
        <div className="mx-4 mt-4 p-4 rounded-2xl" style={{ background: '#111118', border: '1px solid #1e1e28' }}>
          <TextInput onSubmit={handleText} disabled={interpreting} placeholder="Registrar movimiento..." />
        </div>
      </div>

      <AIModal isOpen={modalOpen} interpretation={interpretation} wallets={wallets} categories={categories}
        onConfirm={handleConfirm} onCancel={() => { setModalOpen(false); setInterpretation(null); }} />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 z-[100] px-5 py-3 rounded-2xl text-sm font-medium"
            style={{ transform: 'translateX(-50%)', background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
