import { useState, useEffect } from 'react';
import AppShell from './layout/AppShell';
import { CATEGORY_COLORS } from '../lib/utils';

interface Wallet {
  id: number;
  name: string;
  emoji: string;
  color: string;
  currency: string;
  balance: number;
  type: 'debit' | 'credit' | 'pocket';
  interestRate: number;
  interestPeriod: 'EA' | 'MV';
  includeInBalance: boolean;
}

const CURRENCIES = ['COP', 'USD'];
const EMOJIS = ['💳', '$', '🏦', '💵', '🟡', '🔵'];
const typeLabels = { debit: 'Debito', credit: 'Credito', pocket: 'Bolsillo' };

function formatMoney(n: number, currency = 'COP') {
  try { return new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n); }
  catch { return `$${n}`; }
}

const emptyForm = {
  name: '',
  emoji: '💳',
  color: '#6366f1',
  currency: 'COP',
  balance: '',
  type: 'debit' as Wallet['type'],
  interestRate: '',
  interestPeriod: 'EA' as Wallet['interestPeriod'],
  includeInBalance: true,
};

export default function BilleterasScreen() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchWallets = async () => {
    const res = await fetch('/api/wallets');
    const data = await res.json();
    setWallets(data.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchWallets(); }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    const method = editingId ? 'PUT' : 'POST';
    await fetch('/api/wallets', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingId,
        ...form,
        balance: parseFloat(form.balance || '0'),
        interestRate: parseFloat(form.interestRate || '0'),
      }),
    });
    showToast(editingId ? 'Billetera actualizada' : 'Billetera creada');
    resetForm();
    fetchWallets();
  };

  const handleEdit = (w: Wallet) => {
    setForm({
      name: w.name,
      emoji: w.emoji,
      color: w.color,
      currency: w.currency,
      balance: String(w.balance),
      type: w.type ?? 'debit',
      interestRate: String(w.interestRate ?? 0),
      interestPeriod: w.interestPeriod ?? 'EA',
      includeInBalance: w.includeInBalance !== false,
    });
    setEditingId(w.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/wallets?id=${id}`, { method: 'DELETE' });
    showToast('Billetera archivada');
    fetchWallets();
  };

  const toggleBalance = async (w: Wallet) => {
    await fetch('/api/wallets', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: w.id, includeInBalance: !w.includeInBalance }) });
    fetchWallets();
  };

  const totalBalance = wallets.reduce((acc, w) => acc + (w.includeInBalance ? w.balance : 0), 0);
  const sections = [
    ['debit', 'Cuentas debito'],
    ['credit', 'Creditos'],
    ['pocket', 'Bolsillos'],
  ] as const;

  return (
    <AppShell currentPath="/billeteras" title="Billeteras">
      <div className="pb-8">
        <div className="mx-4 mt-5 p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, #1a1530, #12112a)', border: '1px solid rgba(124,106,247,0.2)' }}>
          <p className="text-xs" style={{ color: '#5a5870' }}>Total disponible</p>
          <p className="text-3xl font-bold mt-1" style={{ color: '#f1f0ff' }}>{formatMoney(totalBalance)}</p>
          <p className="text-xs mt-1" style={{ color: '#7c6af7' }}>{wallets.filter(w => w.includeInBalance).length} incluidas en balance</p>
        </div>

        {loading ? (
          <div className="px-4 mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
          </div>
        ) : (
          sections.map(([type, title]) => {
            const items = wallets.filter(w => (w.type ?? 'debit') === type);
            if (!items.length) return null;
            return (
              <section key={type} className="px-4 mt-5">
                <h2 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: '#9896b0' }}>{title}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(w => (
                    <div key={w.id} className="rounded-2xl p-5 min-w-0" style={{ background: `linear-gradient(135deg, ${w.color}22, rgba(17,17,24,0.9))`, border: `1px solid ${w.color}55` }}>
                      <div className="flex justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${w.color}33`, border: `1px solid ${w.color}88` }}>{w.emoji}</div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-lg truncate" style={{ color: '#f1f0ff' }}>{w.name}</h3>
                            <p className="text-xs font-medium uppercase" style={{ color: w.color }}>{w.currency} - {typeLabels[w.type ?? 'debit']}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(w)} className="p-2 rounded-lg" style={{ background: 'rgba(124,106,247,0.12)', color: '#7c6af7', border: '1px solid rgba(124,106,247,0.25)' }} aria-label="Editar">✎</button>
                          <button onClick={() => handleDelete(w.id)} className="p-2 rounded-lg" style={{ background: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.25)' }} aria-label="Archivar">x</button>
                        </div>
                      </div>
                      <p className="text-xs mt-6 mb-1" style={{ color: '#9896b0' }}>Saldo actual</p>
                      <p className="text-3xl font-bold truncate" style={{ color: w.balance >= 0 ? '#f1f0ff' : '#f43f5e' }}>{formatMoney(w.balance, w.currency)}</p>
                      {(w.type === 'credit' || w.type === 'pocket') && (
                        <p className="text-xs mt-2" style={{ color: '#9896b0' }}>Rendimiento/interes: {w.interestRate || 0}% {w.interestPeriod}</p>
                      )}
                      <button onClick={() => toggleBalance(w)} className="mt-4 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: w.includeInBalance ? 'rgba(34,197,94,0.12)' : 'rgba(244,63,94,0.12)', color: w.includeInBalance ? '#22c55e' : '#f43f5e', border: '1px solid #2a2a38' }}>
                        {w.includeInBalance ? 'Incluida en balance' : 'Oculta del balance'}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}

        <div className="px-4 mt-4">
          <button onClick={() => { resetForm(); setShowForm(true); }} className="w-full py-4 rounded-2xl text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #7c6af7, #ec4899)', border: 'none', color: 'white', cursor: 'pointer' }}>
            Nueva Billetera
          </button>
        </div>
      </div>

      {showForm && (
        <>
          <button className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.7)', border: 0 }} onClick={resetForm} aria-label="Cerrar" />
          <div className="fixed inset-0 z-50 flex items-end justify-center pb-[3%] px-4 pointer-events-none">
            <div className="w-full rounded-3xl overflow-y-auto pointer-events-auto" style={{ maxWidth: '440px', maxHeight: '85dvh', background: '#111118', border: '1px solid #2a2a38' }}>
              <div className="p-5" style={{ borderBottom: '1px solid #1e1e28' }}>
                <h2 className="text-base font-bold" style={{ color: '#f1f0ff' }}>{editingId ? 'Editar billetera' : 'Nueva billetera'}</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                <div>
                  <span className="text-xs font-medium block mb-2" style={{ color: '#9896b0' }}>Tipo</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['debit', 'credit', 'pocket'] as const).map(t => (
                      <button type="button" key={t} onClick={() => setForm(f => ({ ...f, type: t, currency: t === 'pocket' ? f.currency : f.currency }))} className="py-2 rounded-xl text-xs font-medium" style={{ background: form.type === t ? 'rgba(124,106,247,0.2)' : '#18181f', border: `1px solid ${form.type === t ? '#7c6af7' : '#2a2a38'}`, color: form.type === t ? '#f1f0ff' : '#9896b0' }}>
                        {typeLabels[t]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium block mb-2" style={{ color: '#9896b0' }}>Icono</span>
                  <div className="flex flex-wrap gap-2">
                    {EMOJIS.map(e => (
                      <button type="button" key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))} className="w-10 h-10 rounded-xl text-xl flex items-center justify-center" style={{ background: form.emoji === e ? 'rgba(124,106,247,0.2)' : '#18181f', border: `1px solid ${form.emoji === e ? '#7c6af7' : '#2a2a38'}` }}>{e}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="wallet-name" className="text-xs font-medium block mb-1.5" style={{ color: '#9896b0' }}>Nombre</label>
                  <input id="wallet-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Bancolombia, Nequi..." required className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', fontFamily: 'inherit' }} />
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label htmlFor="wallet-currency" className="text-xs font-medium block mb-1.5" style={{ color: '#9896b0' }}>Moneda</label>
                    <select id="wallet-currency" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="w-full rounded-xl px-3 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', fontFamily: 'inherit' }}>
                      {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label htmlFor="wallet-balance" className="text-xs font-medium block mb-1.5" style={{ color: '#9896b0' }}>Saldo inicial</label>
                    <input id="wallet-balance" type="number" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} placeholder="0" className="w-full rounded-xl px-3 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', fontFamily: 'inherit' }} />
                  </div>
                </div>

                {(form.type === 'credit' || form.type === 'pocket') && (
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label htmlFor="wallet-rate" className="text-xs font-medium block mb-1.5" style={{ color: '#9896b0' }}>{form.type === 'credit' ? 'Interes' : 'Rendimiento'} (%)</label>
                      <input id="wallet-rate" type="number" value={form.interestRate} onChange={e => setForm(f => ({ ...f, interestRate: e.target.value }))} placeholder="0" className="w-full rounded-xl px-3 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', fontFamily: 'inherit' }} />
                    </div>
                    <div className="w-28">
                      <label htmlFor="wallet-period" className="text-xs font-medium block mb-1.5" style={{ color: '#9896b0' }}>Periodo</label>
                      <select id="wallet-period" value={form.interestPeriod} onChange={e => setForm(f => ({ ...f, interestPeriod: e.target.value as Wallet['interestPeriod'] }))} className="w-full rounded-xl px-3 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', fontFamily: 'inherit' }}>
                        <option>EA</option><option>MV</option>
                      </select>
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2 text-xs" style={{ color: '#9896b0' }}>
                  <input type="checkbox" checked={form.includeInBalance} onChange={e => setForm(f => ({ ...f, includeInBalance: e.target.checked }))} />
                  Incluir en balance total
                </label>

                <div>
                  <span className="text-xs font-medium block mb-2" style={{ color: '#9896b0' }}>Color</span>
                  <div className="flex gap-2 flex-wrap">
                    {CATEGORY_COLORS.map(c => <button type="button" key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className="w-8 h-8 rounded-lg" style={{ background: c, border: `2px solid ${form.color === c ? 'white' : 'transparent'}` }} />)}
                  </div>
                </div>

                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={resetForm} className="flex-1 py-3.5 rounded-2xl text-sm font-medium" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#9896b0', cursor: 'pointer' }}>Cancelar</button>
                  <button type="submit" className="flex-1 py-3.5 rounded-2xl text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #7c6af7, #ec4899)', border: 'none', color: 'white', cursor: 'pointer' }}>{editingId ? 'Guardar' : 'Crear'}</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 z-[100] px-5 py-3 rounded-2xl text-sm font-medium" style={{ transform: 'translateX(-50%)', background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>{toast}</div>}
    </AppShell>
  );
}
