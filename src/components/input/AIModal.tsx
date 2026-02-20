import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORY_COLORS } from '../../lib/utils';

interface AIInterpretation {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  description: string;
  category: { id: number | null; name: string; emoji: string; exists: boolean };
  wallet: { id: number | null; name: string; emoji: string; exists: boolean };
  walletDestination?: { id: number | null; name: string; emoji: string; exists: boolean } | null;
  confidence: number;
  clarification?: string | null;
  rawText: string;
}

interface Wallet { id: number; name: string; emoji: string; }
interface Category { id: number; name: string; emoji: string; }

interface AIModalProps {
  interpretation: AIInterpretation | null;
  wallets: Wallet[];
  categories: Category[];
  onConfirm: (data: any) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
}

const typeLabels = { income: 'Ingreso', expense: 'Gasto', transfer: 'Transferencia' };
const typeColors = { income: '#22c55e', expense: '#f43f5e', transfer: '#3b82f6' };

function formatCOP(n: number, currency = 'COP') {
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  } catch { return `$${n.toLocaleString()}`; }
}

export default function AIModal({ interpretation, wallets, categories, onConfirm, onCancel, isOpen }: AIModalProps) {
  const [editedData, setEditedData] = useState<AIInterpretation | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('');
  const [loading, setLoading] = useState(false);

  const data = editedData ?? interpretation;

  if (!data) return null;

  const needsNewCategory = data.category && !data.category.exists;
  const needsNewWallet = data.wallet && !data.wallet.exists;

  const handleConfirm = async () => {
    if (!data) return;
    setLoading(true);
    try {
      let categoryId = data.category?.id ?? null;
      let walletId = data.wallet?.id ?? null;

      // Crear categoría si no existe
      if (needsNewCategory && creatingCategory) {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.category.name,
            emoji: newCategoryEmoji || data.category.emoji,
            color: CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)],
            type: data.type === 'income' ? 'income' : 'expense',
          }),
        });
        const created = await res.json();
        categoryId = created.data?.id ?? null;
      }

      // Crear wallet si no existe
      if (needsNewWallet) {
        const res = await fetch('/api/wallets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: data.wallet.name, emoji: data.wallet.emoji }),
        });
        const created = await res.json();
        walletId = created.data?.id ?? null;
      }

      await onConfirm({
        type: data.type,
        amount: data.amount,
        currency: data.currency,
        categoryId,
        walletId,
        walletDestinationId: data.walletDestination?.id ?? null,
        description: data.description,
        aiGenerated: true,
        rawInput: data.rawText,
      });
    } finally {
      setLoading(false);
    }
  };

  const update = (patch: Partial<AIInterpretation>) => {
    setEditedData(prev => ({ ...(prev ?? interpretation!), ...patch }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-end justify-center pb-[5%] px-4 pointer-events-none">
          <motion.div
            className="w-full rounded-3xl overflow-y-auto pointer-events-auto"
            style={{
              maxWidth: '440px',
              maxHeight: '85dvh',
              background: '#111118',
              border: '1px solid #2a2a38',
            }}
            initial={{ y: 80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid #1e1e28' }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-lg font-medium"
                    style={{ background: `${typeColors[data.type]}18`, color: typeColors[data.type] }}>
                    {typeLabels[data.type]}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(124,106,247,0.1)', color: '#7c6af7' }}>
                    🤖 IA
                  </span>
                </div>
                <button onClick={onCancel} style={{ color: '#5a5870', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <p className="text-xs mt-1" style={{ color: '#5a5870' }}>
                "{data.rawText}"
              </p>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Monto */}
              <div>
                <label htmlFor="ai-amount" className="text-xs font-medium mb-1.5 block" style={{ color: '#9896b0' }}>Monto</label>
                <div className="flex items-center gap-2">
                  <input
                    id="ai-amount"
                    type="number"
                    value={data.amount}
                    onChange={e => update({ amount: parseFloat(e.target.value) || 0 })}
                    className="flex-1 rounded-xl px-4 py-3 text-lg font-bold outline-none"
                    style={{ background: '#18181f', border: '1px solid #2a2a38', color: typeColors[data.type], fontFamily: 'inherit' }}
                  />
                  <select
                    aria-label="Moneda"
                    value={data.currency}
                    onChange={e => update({ currency: e.target.value })}
                    className="rounded-xl px-3 py-3 text-sm outline-none"
                    style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', fontFamily: 'inherit' }}
                  >
                    <option>COP</option><option>USD</option><option>EUR</option>
                  </select>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="ai-desc" className="text-xs font-medium mb-1.5 block" style={{ color: '#9896b0' }}>Descripción</label>
                <input
                  id="ai-desc"
                  value={data.description}
                  onChange={e => update({ description: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', fontFamily: 'inherit' }}
                />
              </div>

              {/* Tipo */}
              <div>
                <span className="text-xs font-medium mb-1.5 block" style={{ color: '#9896b0' }}>Tipo</span>
                <div className="flex gap-2">
                  {(['expense', 'income', 'transfer'] as const).map(t => (
                    <button key={t}
                      onClick={() => update({ type: t })}
                      className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors"
                      style={{
                        background: data.type === t ? `${typeColors[t]}20` : '#18181f',
                        border: `1px solid ${data.type === t ? typeColors[t] : '#2a2a38'}`,
                        color: data.type === t ? typeColors[t] : '#9896b0',
                        cursor: 'pointer',
                      }}
                    >
                      {typeLabels[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categoría */}
              <div>
                <span className="text-xs font-medium mb-1.5 block" style={{ color: '#9896b0' }}>
                  Categoría
                  {needsNewCategory && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308' }}>Nueva</span>}
                </span>
                {needsNewCategory ? (
                  <div className="rounded-xl p-3" style={{ background: '#18181f', border: '1px solid rgba(234,179,8,0.3)' }}>
                    <p className="text-sm font-medium" style={{ color: '#f1f0ff' }}>
                      La IA sugiere: <span style={{ color: '#eab308' }}>{data.category.emoji} {data.category.name}</span>
                    </p>
                    <p className="text-xs mt-1 mb-3" style={{ color: '#9896b0' }}>Esta categoría no existe. ¿Deseas crearla?</p>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        value={newCategoryEmoji || data.category.emoji}
                        onChange={e => setNewCategoryEmoji(e.target.value)}
                        placeholder="Emoji"
                        className="w-14 text-center rounded-xl px-2 py-2 text-base outline-none"
                        style={{ background: '#111118', border: '1px solid #2a2a38', color: '#f1f0ff', fontFamily: 'inherit' }}
                      />
                      <span className="text-sm" style={{ color: '#9896b0' }}>{data.category.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCreatingCategory(true)}
                        className="flex-1 py-2 rounded-xl text-xs font-medium"
                        style={{ background: creatingCategory ? 'rgba(234,179,8,0.2)' : '#111118', border: `1px solid ${creatingCategory ? '#eab308' : '#2a2a38'}`, color: creatingCategory ? '#eab308' : '#9896b0', cursor: 'pointer' }}
                      >
                        ✓ Sí, crear categoría
                      </button>
                      <button
                        onClick={() => { setCreatingCategory(false); update({ category: { ...data.category, id: null, exists: false } }); }}
                        className="flex-1 py-2 rounded-xl text-xs font-medium"
                        style={{ background: '#111118', border: '1px solid #2a2a38', color: '#9896b0', cursor: 'pointer' }}
                      >
                        Sin categoría
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={data.category?.id ?? ''}
                    onChange={e => {
                      const cat = categories.find(c => c.id === parseInt(e.target.value));
                      if (cat) update({ category: { id: cat.id, name: cat.name, emoji: cat.emoji, exists: true } });
                    }}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', fontFamily: 'inherit' }}
                  >
                    <option value="">Sin categoría</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                  </select>
                )}
              </div>

              {/* Billetera */}
              <div>
                <span className="text-xs font-medium mb-1.5 block" style={{ color: '#9896b0' }}>
                  Billetera
                  {needsNewWallet && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308' }}>Nueva</span>}
                </span>
                {needsNewWallet ? (
                  <div className="rounded-xl p-3" style={{ background: '#18181f', border: '1px solid rgba(234,179,8,0.3)' }}>
                    <p className="text-sm" style={{ color: '#f1f0ff' }}>Se creará: <span style={{ color: '#eab308' }}>{data.wallet.emoji} {data.wallet.name}</span></p>
                  </div>
                ) : (
                  <select
                    value={data.wallet?.id ?? ''}
                    onChange={e => {
                      const w = wallets.find(w => w.id === parseInt(e.target.value));
                      if (w) update({ wallet: { id: w.id, name: w.name, emoji: w.emoji, exists: true } });
                    }}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', fontFamily: 'inherit' }}
                  >
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.emoji} {w.name}</option>)}
                  </select>
                )}
              </div>

              {/* Clarificación de IA */}
              {data.clarification && (
                <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.3)' }}>
                  <p className="text-xs" style={{ color: '#9896b0' }}>🤖 {data.clarification}</p>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="px-5 pb-6 flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3.5 rounded-2xl text-sm font-medium"
                style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#9896b0', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <motion.button
                onClick={handleConfirm}
                disabled={loading || !data.amount || !data.wallet?.id && !needsNewWallet}
                whileTap={{ scale: 0.97 }}
                className="flex-1 py-3.5 rounded-2xl text-sm font-semibold"
                style={{
                  background: 'linear-gradient(135deg, #7c6af7, #ec4899)',
                  border: 'none',
                  color: 'white',
                  cursor: loading ? 'wait' : 'pointer',
                  boxShadow: '0 4px 16px rgba(124,106,247,0.3)',
                }}
              >
                {loading ? '⏳ Guardando...' : '✓ Confirmar'}
              </motion.button>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
