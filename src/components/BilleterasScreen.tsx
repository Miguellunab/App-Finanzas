import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from './layout/AppShell';
import { CATEGORY_COLORS } from '../lib/utils';
import WalletCardAnim from './animations/WalletCardAnim';

interface Wallet {
  id: number;
  name: string;
  emoji: string;
  color: string;
  currency: string;
  balance: number;
}

function formatCOP(n: number, currency = 'COP') {
  try { return new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n); }
  catch { return `$${n}`; }
}

const CURRENCIES = ['COP', 'USD', 'EUR'];
const EMOJIS = ['💳', '💵', '🏦', '💜', '🟡', '🔵', '💰', '🏧', '💸', '🎯'];

export default function BilleterasScreen() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', emoji: '💳', color: '#6366f1', currency: 'COP', balance: '' });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchWallets = async () => {
    const res = await fetch('/api/wallets');
    const data = await res.json();
    setWallets(data.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchWallets(); }, []);

  const resetForm = () => {
    setForm({ name: '', emoji: '💳', color: '#6366f1', currency: 'COP', balance: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    const method = editingId ? 'PUT' : 'POST';
    const body = editingId
      ? { id: editingId, ...form, balance: parseFloat(form.balance || '0') }
      : { ...form, balance: parseFloat(form.balance || '0') };

    await fetch('/api/wallets', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    showToast(editingId ? '✓ Billetera actualizada' : '✓ Billetera creada');
    resetForm();
    fetchWallets();
  };

  const handleEdit = (w: Wallet) => {
    setForm({ name: w.name, emoji: w.emoji, color: w.color, currency: w.currency, balance: String(w.balance) });
    setEditingId(w.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/wallets?id=${id}`, { method: 'DELETE' });
    showToast('Billetera archivada');
    fetchWallets();
  };

  const totalBalance = wallets.reduce((acc, w) => acc + (w.currency === 'COP' ? w.balance : w.balance), 0);

  return (
    <AppShell currentPath="/billeteras" title="Billeteras">
      <div className="pb-8">
        {/* Balance total header */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-5 p-5 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, #1a1530, #12112a)', border: '1px solid rgba(124,106,247,0.2)' }}>
          <p className="text-xs" style={{ color: '#5a5870' }}>Total en billeteras</p>
          <p className="text-3xl font-bold mt-1" style={{ color: '#f1f0ff' }}>{formatCOP(totalBalance)}</p>
          <p className="text-xs mt-1" style={{ color: '#7c6af7' }}>{wallets.length} billetera{wallets.length !== 1 ? 's' : ''} activa{wallets.length !== 1 ? 's' : ''}</p>
        </motion.div>

        {/* Lista de wallets */}
        <div className="px-4 mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)
          ) : wallets.length === 0 ? (
            <div className="text-center py-10 col-span-1 md:col-span-2">
              <p className="text-2xl mb-2">💳</p>
              <p className="text-sm" style={{ color: '#9896b0' }}>No hay billeteras</p>
            </div>
          ) : (
            <AnimatePresence>
              {wallets.map((w, i) => (
                <WalletCardAnim 
                  key={w.id} 
                  wallet={w} 
                  onEdit={handleEdit} 
                  onDelete={handleDelete} 
                  formatCOP={formatCOP} 
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Botón agregar */}
        <div className="px-4 mt-4">
          <motion.button
            onClick={() => { resetForm(); setShowForm(true); }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #7c6af7, #ec4899)', border: 'none', color: 'white', cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,106,247,0.3)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva Billetera
          </motion.button>
        </div>
      </div>

      {/* Modal de formulario */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={resetForm} />
            <div className="fixed inset-0 z-50 flex items-end justify-center pb-[3%] px-4 pointer-events-none">
            <motion.div
              className="w-full rounded-3xl overflow-y-auto pointer-events-auto"
              style={{ maxWidth: '440px', maxHeight: '85dvh', background: '#111118', border: '1px solid #2a2a38' }}
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            >
              <div className="p-5" style={{ borderBottom: '1px solid #1e1e28' }}>
                <h2 className="text-base font-bold" style={{ color: '#f1f0ff' }}>
                  {editingId ? 'Editar billetera' : 'Nueva billetera'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                {/* Emoji picker */}
                <div>
                  <span className="text-xs font-medium block mb-2" style={{ color: '#9896b0' }}>Emoji</span>
                  <div className="flex flex-wrap gap-2">
                    {EMOJIS.map(e => (
                      <button type="button" key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                        className="w-10 h-10 rounded-xl text-xl flex items-center justify-center"
                        style={{ background: form.emoji === e ? 'rgba(124,106,247,0.2)' : '#18181f', border: `1px solid ${form.emoji === e ? '#7c6af7' : '#2a2a38'}`, cursor: 'pointer' }}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nombre */}
                <div>
                  <label htmlFor="wallet-name" className="text-xs font-medium block mb-1.5" style={{ color: '#9896b0' }}>Nombre</label>
                  <input id="wallet-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Bancolombia, Nequi..."
                    required className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', fontFamily: 'inherit' }} />
                </div>

                {/* Color */}
                <div>
                  <span className="text-xs font-medium block mb-2" style={{ color: '#9896b0' }}>Color</span>
                  <div className="flex gap-2 flex-wrap">
                    {CATEGORY_COLORS.map(c => (
                      <button type="button" key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                        className="w-8 h-8 rounded-lg"
                        style={{ background: c, border: `2px solid ${form.color === c ? 'white' : 'transparent'}`, cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>

                {/* Moneda y balance inicial */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label htmlFor="wallet-currency" className="text-xs font-medium block mb-1.5" style={{ color: '#9896b0' }}>Moneda</label>
                    <select id="wallet-currency" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                      className="w-full rounded-xl px-3 py-3 text-sm outline-none"
                      style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', fontFamily: 'inherit' }}>
                      {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label htmlFor="wallet-balance" className="text-xs font-medium block mb-1.5" style={{ color: '#9896b0' }}>Saldo inicial</label>
                    <input id="wallet-balance" type="number" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}
                      placeholder="0" className="w-full rounded-xl px-3 py-3 text-sm outline-none"
                      style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', fontFamily: 'inherit' }} />
                  </div>
                </div>

                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={resetForm}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-medium"
                    style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#9896b0', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button type="submit"
                    className="flex-1 py-3.5 rounded-2xl text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg, #7c6af7, #ec4899)', border: 'none', color: 'white', cursor: 'pointer' }}>
                    {editingId ? 'Guardar' : 'Crear'}
                  </button>
                </div>
              </form>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 z-[100] px-5 py-3 rounded-2xl text-sm font-medium"
            style={{ transform: 'translateX(-50%)', background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
