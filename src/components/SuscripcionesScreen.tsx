import { useEffect, useState } from 'react';
import AppShell from './layout/AppShell';
import { formatNumberInput, parseNumberInput, walletLogo } from '../lib/utils';

interface Wallet {
  id: number;
  name: string;
  emoji: string;
}

interface Subscription {
  id: number;
  name: string;
  amount: number;
  currency: string;
  chargeDay: number;
  nextChargeDate: string;
  walletName?: string | null;
  walletEmoji?: string | null;
}

const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
const emptyForm = { name: '', chargeDay: '', amount: '', walletId: '' };

function money(n: number, currency = 'COP') {
  try { return new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n); }
  catch { return `$${n}`; }
}

function WalletMark({ emoji, name }: { emoji?: string | null; name?: string | null }) {
  const logo = walletLogo(emoji ?? '', name ?? '');
  return logo ? <img src={logo} alt="" className="h-7 w-7 object-contain" /> : <>{emoji ?? '$'}</>;
}

export default function SuscripcionesScreen() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const fetchAll = async () => {
    const [subsRes, walletsRes] = await Promise.all([fetch('/api/subscriptions'), fetch('/api/wallets')]);
    const [subsData, walletsData] = await Promise.all([subsRes.json(), walletsRes.json()]);
    setSubscriptions(subsData.data ?? []);
    setWallets(walletsData.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const closeForm = () => {
    setForm(emptyForm);
    setShowForm(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseNumberInput(form.amount) }),
    });
    closeForm();
    showToast('Suscripcion creada');
    fetchAll();
  };

  const remove = async (id: number) => {
    await fetch(`/api/subscriptions?id=${id}`, { method: 'DELETE' });
    showToast('Suscripcion archivada');
    fetchAll();
  };

  return (
    <AppShell currentPath="/suscripciones" title="Suscripciones">
      <div className="px-4 py-5 pb-8">
        <div className="flex flex-col gap-2">
          {loading ? [...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />) : subscriptions.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: '#9896b0' }}>Sin suscripciones</p>
          ) : subscriptions.map(sub => (
            <div key={sub.id} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#111118', border: '1px solid #1e1e28' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg overflow-hidden" style={{ background: 'rgba(124,106,247,0.16)' }}><WalletMark emoji={sub.walletEmoji} name={sub.walletName} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#f1f0ff' }}>{sub.name}</p>
                <p className="text-xs" style={{ color: '#9896b0' }}>{sub.walletName ?? 'Sin billetera'} - dia {sub.chargeDay} - proximo {sub.nextChargeDate}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold" style={{ color: '#f43f5e' }}>-{money(sub.amount, sub.currency)}</p>
                <button onClick={() => remove(sub.id)} className="mt-1 text-xs rounded-lg px-2 py-1" style={{ color: '#f43f5e', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>Quitar</button>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setShowForm(true)} className="w-full mt-4 py-4 rounded-2xl text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #7c6af7, #ec4899)', border: 'none', color: 'white' }}>Añadir suscripcion</button>
      </div>

      {showForm && (
        <>
          <button className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.7)', border: 0 }} onClick={closeForm} aria-label="Cerrar" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full rounded-3xl overflow-hidden pointer-events-auto" style={{ maxWidth: '440px', background: '#111118', border: '1px solid #2a2a38' }}>
              <div className="p-5" style={{ borderBottom: '1px solid #1e1e28' }}><h2 className="text-base font-bold" style={{ color: '#f1f0ff' }}>Nueva suscripcion</h2></div>
              <form onSubmit={submit} className="p-5 flex flex-col gap-4">
                <label className="text-xs font-medium" style={{ color: '#9896b0' }}>Nombre
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="mt-1.5 w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff' }} />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-medium" style={{ color: '#9896b0' }}>Dia de cobro
                    <select value={form.chargeDay} onChange={e => setForm(f => ({ ...f, chargeDay: e.target.value }))} required className="mt-1.5 w-full rounded-xl px-3 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff' }}>
                      <option value="">Dia</option>
                      {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-medium" style={{ color: '#9896b0' }}>Valor
                    <input inputMode="numeric" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: formatNumberInput(e.target.value) }))} required className="mt-1.5 w-full rounded-xl px-3 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff' }} />
                  </label>
                </div>

                <div>
                  <span className="text-xs font-medium block mb-2" style={{ color: '#9896b0' }}>Billetera</span>
                  <div className="grid grid-cols-2 gap-2">
                    {wallets.map(w => (
                      <button type="button" key={w.id} onClick={() => setForm(f => ({ ...f, walletId: String(w.id) }))} className="flex items-center gap-2 min-w-0 rounded-xl px-3 py-3 text-sm" style={{ background: form.walletId === String(w.id) ? 'rgba(124,106,247,0.2)' : '#18181f', border: `1px solid ${form.walletId === String(w.id) ? '#7c6af7' : '#2a2a38'}`, color: '#f1f0ff' }}>
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0" style={{ background: 'rgba(124,106,247,0.14)' }}><WalletMark emoji={w.emoji} name={w.name} /></span>
                        <span className="truncate">{w.name}</span>
                      </button>
                    ))}
                  </div>
                  <input tabIndex={-1} required value={form.walletId} onChange={() => {}} className="sr-only" />
                </div>

                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={closeForm} className="flex-1 py-3.5 rounded-2xl text-sm font-medium" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#9896b0' }}>Cancelar</button>
                  <button type="submit" className="flex-1 py-3.5 rounded-2xl text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #7c6af7, #ec4899)', border: 'none', color: 'white' }}>Crear</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {toast && <div className="fixed left-1/2 z-[100] px-5 py-3 rounded-2xl text-sm font-medium" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)', transform: 'translateX(-50%)', background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>{toast}</div>}
    </AppShell>
  );
}
