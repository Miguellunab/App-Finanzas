import { useEffect, useState } from 'react';
import AppShell from './layout/AppShell';
import { CATEGORY_COLORS, WALLET_LOGOS, formatNumberInput, parseNumberInput, walletLogo } from '../lib/utils';

type WalletType = 'debit' | 'credit' | 'pocket' | 'vault';

interface Wallet {
  id: number;
  name: string;
  emoji: string;
  color: string;
  currency: string;
  balance: number;
  type: WalletType;
  interestRate: number;
  interestPeriod: 'EA' | 'MV';
  creditLimit: number;
  statementDay?: number | null;
  dueDay?: number | null;
  interestFromFirstInstallment: boolean;
  sourceWalletId?: number | null;
  vaultStartDate?: string | null;
  vaultEndDate?: string | null;
  includeInBalance: boolean;
}

const labels: Record<WalletType, string> = { debit: 'Debito', credit: 'Credito', pocket: 'Bolsillo', vault: 'Boveda' };
const sections: Array<[WalletType, string]> = [['debit', 'Cuentas debito'], ['credit', 'Tarjetas credito'], ['pocket', 'Bolsillos'], ['vault', 'Bovedas']];
const icons = ['💳', '$', '🏦', '💵', '🔒', '🎯', '📈', '🧾', '💼', '🏠'];
const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
const emptyForm = {
  name: '', emoji: '💳', color: '#6366f1', currency: 'COP', balance: '',
  type: 'debit' as WalletType, interestRate: '', interestPeriod: 'EA' as 'EA' | 'MV',
  creditLimit: '', statementDay: '', dueDay: '', interestFromFirstInstallment: false,
  sourceWalletId: '', vaultStartDate: '', vaultEndDate: '', includeInBalance: true,
};

function money(n: number, currency = 'COP') {
  try { return new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n); }
  catch { return `$${n}`; }
}

function projectedVault(w: Wallet) {
  if (!w.vaultEndDate || !w.interestRate) return w.balance;
  const start = w.vaultStartDate ? new Date(`${w.vaultStartDate}T00:00:00`).getTime() : Date.now();
  const days = Math.max(0, Math.ceil((new Date(`${w.vaultEndDate}T00:00:00`).getTime() - start) / 86400000));
  const annual = w.interestPeriod === 'MV' ? Math.pow(1 + w.interestRate / 100, 12) - 1 : w.interestRate / 100;
  return w.balance * Math.pow(1 + annual, days / 365);
}

function rateLabel(w: Wallet) {
  if (w.type !== 'debit') return `Tasa ${w.interestRate || 0}% ${w.interestPeriod}`;
  const mv = w.interestPeriod === 'MV' ? w.interestRate : (Math.pow(1 + (w.interestRate || 0) / 100, 1 / 12) - 1) * 100;
  return `Tasa ${mv.toFixed(2)}% MV`;
}

function WalletMark({ emoji, name }: { emoji: string; name?: string }) {
  const logo = walletLogo(emoji, name);
  return logo ? <img src={logo} alt="" className="h-7 w-7 object-contain" /> : <>{emoji}</>;
}

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
    await fetch('/api/wallets', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingId,
        ...form,
        balance: form.type === 'credit' && !editingId ? 0 : parseNumberInput(form.balance),
        interestRate: parseFloat(form.interestRate || '0'),
        creditLimit: parseNumberInput(form.creditLimit),
        sourceWalletId: form.type === 'pocket' ? form.sourceWalletId : '',
        includeInBalance: form.type === 'debit' || form.type === 'credit' ? form.includeInBalance : false,
      }),
    });
    showToast(editingId ? 'Billetera actualizada' : 'Billetera creada');
    resetForm();
    fetchWallets();
  };

  const edit = (w: Wallet) => {
    setForm({
      name: w.name, emoji: w.emoji, color: w.color, currency: w.currency, balance: formatNumberInput(w.balance),
      type: w.type ?? 'debit', interestRate: String(w.interestRate ?? 0), interestPeriod: w.interestPeriod ?? 'EA',
      creditLimit: formatNumberInput(w.creditLimit ?? 0), statementDay: String(w.statementDay ?? ''), dueDay: String(w.dueDay ?? ''),
      interestFromFirstInstallment: w.interestFromFirstInstallment ?? false,
      sourceWalletId: String(w.sourceWalletId ?? ''), vaultStartDate: w.vaultStartDate ?? '', vaultEndDate: w.vaultEndDate ?? '',
      includeInBalance: w.includeInBalance !== false,
    });
    setEditingId(w.id);
    setShowForm(true);
  };

  const archive = async (id: number) => {
    await fetch(`/api/wallets?id=${id}`, { method: 'DELETE' });
    showToast('Billetera archivada');
    fetchWallets();
  };

  const toggleBalance = async (w: Wallet) => {
    await fetch('/api/wallets', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: w.id, includeInBalance: !w.includeInBalance }) });
    fetchWallets();
  };

  return (
    <AppShell currentPath="/billeteras" title="Billeteras">
      <div className="pb-8">
        {loading ? (
          <div className="px-4 mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
          </div>
        ) : sections.map(([type, title]) => {
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
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl overflow-hidden" style={{ background: `${w.color}33`, border: `1px solid ${w.color}88` }}><WalletMark emoji={w.emoji} name={w.name} /></div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-lg truncate" style={{ color: '#f1f0ff' }}>{w.name}</h3>
                          <p className="text-xs font-medium uppercase" style={{ color: w.color }}>{w.currency} - {labels[w.type ?? 'debit']}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => edit(w)} className="p-2 rounded-lg" style={{ background: 'rgba(124,106,247,0.12)', color: '#7c6af7', border: '1px solid rgba(124,106,247,0.25)' }} aria-label="Editar">Edit</button>
                        <button onClick={() => archive(w.id)} className="p-2 rounded-lg" style={{ background: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.25)' }} aria-label="Archivar">x</button>
                      </div>
                    </div>
                    <p className="text-xs mt-6 mb-1" style={{ color: '#9896b0' }}>{w.type === 'credit' ? 'Cupo disponible' : 'Saldo actual'}</p>
                    <p className="text-3xl font-bold truncate" style={{ color: w.type === 'credit' || w.balance >= 0 ? '#f1f0ff' : '#f43f5e' }}>{money(w.type === 'credit' ? Math.max(0, w.creditLimit - w.balance) : w.balance, w.currency)}</p>
                    {w.type === 'credit' && <p className="text-xs mt-2" style={{ color: '#9896b0' }}>Usado {money(w.balance || 0, w.currency)} de {money(w.creditLimit || 0, w.currency)} - corte {w.statementDay || '?'} / pago {w.dueDay || '?'}</p>}
                    {w.interestRate > 0 && (w.type === 'debit' || w.type === 'credit' || w.type === 'pocket' || w.type === 'vault') && <p className="text-xs mt-2" style={{ color: '#9896b0' }}>{rateLabel(w)}</p>}
                    {w.type === 'vault' && <p className="text-xs mt-2" style={{ color: '#7c6af7' }}>Inicio {w.vaultStartDate || 'hoy'} - final {w.vaultEndDate || 'sin fecha'} - estimado {money(projectedVault(w), w.currency)}</p>}
                    {w.type === 'pocket' && <p className="text-xs mt-2" style={{ color: '#9896b0' }}>Sale de {wallets.find(x => x.id === w.sourceWalletId)?.name ?? 'sin origen'}</p>}
                    {(w.type === 'debit' || w.type === 'credit') && (
                      <button onClick={() => toggleBalance(w)} className="mt-4 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: w.includeInBalance ? 'rgba(34,197,94,0.12)' : 'rgba(244,63,94,0.12)', color: w.includeInBalance ? '#22c55e' : '#f43f5e', border: '1px solid #2a2a38' }}>
                        {w.includeInBalance ? 'Incluida en balance' : 'Oculta del balance'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        <div className="px-4 mt-4">
          <button onClick={() => { resetForm(); setShowForm(true); }} className="w-full py-4 rounded-2xl text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #7c6af7, #ec4899)', border: 'none', color: 'white', cursor: 'pointer' }}>Nueva Billetera</button>
        </div>
      </div>

      {showForm && (
        <>
          <button className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.7)', border: 0 }} onClick={resetForm} aria-label="Cerrar" />
          <div className="fixed inset-0 z-50 flex items-end justify-center pb-[3%] px-4 pointer-events-none">
            <div className="w-full rounded-3xl overflow-y-auto pointer-events-auto" style={{ maxWidth: '440px', maxHeight: '85dvh', background: '#111118', border: '1px solid #2a2a38' }}>
              <div className="p-5" style={{ borderBottom: '1px solid #1e1e28' }}><h2 className="text-base font-bold" style={{ color: '#f1f0ff' }}>{editingId ? 'Editar billetera' : 'Nueva billetera'}</h2></div>
              <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                <div>
                  <span className="text-xs font-medium block mb-2" style={{ color: '#9896b0' }}>Tipo</span>
                  <div className="grid grid-cols-4 gap-2">
                    {(['debit', 'credit', 'pocket', 'vault'] as WalletType[]).map(t => (
                      <button type="button" key={t} onClick={() => setForm(f => ({ ...f, type: t, balance: t === 'credit' && f.type !== 'credit' ? '' : f.balance, includeInBalance: t === 'debit' || t === 'credit' ? f.includeInBalance : false }))} className="py-2 rounded-xl text-xs font-medium" style={{ background: form.type === t ? 'rgba(124,106,247,0.2)' : '#18181f', border: `1px solid ${form.type === t ? '#7c6af7' : '#2a2a38'}`, color: form.type === t ? '#f1f0ff' : '#9896b0' }}>{labels[t]}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium block mb-2" style={{ color: '#9896b0' }}>Icono</span>
                  <div className="flex flex-wrap gap-2">
                    {[...icons, ...WALLET_LOGOS.map(l => l.src)].map(i => <button type="button" key={i} onClick={() => setForm(f => ({ ...f, emoji: i }))} className="w-10 h-10 rounded-xl text-xl flex items-center justify-center overflow-hidden" style={{ background: form.emoji === i ? 'rgba(124,106,247,0.2)' : '#18181f', border: `1px solid ${form.emoji === i ? '#7c6af7' : '#2a2a38'}` }}><WalletMark emoji={i} /></button>)}
                  </div>
                </div>

                <label className="text-xs font-medium" style={{ color: '#9896b0' }}>Nombre
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="mt-1.5 w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff' }} />
                </label>

                <div className="flex gap-3">
                  <label className="flex-1 text-xs font-medium" style={{ color: '#9896b0' }}>Moneda
                    <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="mt-1.5 w-full rounded-xl px-3 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff' }}><option>COP</option><option>USD</option></select>
                  </label>
                  {form.type !== 'credit' && <label className="flex-1 text-xs font-medium" style={{ color: '#9896b0' }}>Saldo
                    <input inputMode="numeric" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: formatNumberInput(e.target.value) }))} className="mt-1.5 w-full rounded-xl px-3 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff' }} />
                  </label>}
                </div>

                {form.type === 'pocket' && (
                  <label className="text-xs font-medium" style={{ color: '#9896b0' }}>Sale de
                    <select value={form.sourceWalletId} onChange={e => setForm(f => ({ ...f, sourceWalletId: e.target.value }))} className="mt-1.5 w-full rounded-xl px-3 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff' }}>
                      <option value="">Selecciona origen</option>
                      {wallets.filter(w => w.type !== 'pocket' && w.type !== 'vault').map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </label>
                )}

                {form.type === 'credit' && (
                  <>
                    <div className="flex gap-3">
                      <label className="flex-1 text-xs font-medium" style={{ color: '#9896b0' }}>Cupo<input inputMode="numeric" value={form.creditLimit} onChange={e => setForm(f => ({ ...f, creditLimit: formatNumberInput(e.target.value) }))} className="mt-1.5 w-full rounded-xl px-3 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff' }} /></label>
                      <label className="flex-1 text-xs font-medium" style={{ color: '#9896b0' }}>Corte<select value={form.statementDay} onChange={e => setForm(f => ({ ...f, statementDay: e.target.value }))} className="mt-1.5 w-full rounded-xl px-3 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff' }}><option value="">Dia</option>{days.map(d => <option key={d} value={d}>{d}</option>)}</select></label>
                      <label className="flex-1 text-xs font-medium" style={{ color: '#9896b0' }}>Pago<select value={form.dueDay} onChange={e => setForm(f => ({ ...f, dueDay: e.target.value }))} className="mt-1.5 w-full rounded-xl px-3 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff' }}><option value="">Dia</option>{days.map(d => <option key={d} value={d}>{d}</option>)}</select></label>
                    </div>
                    <label className="flex items-center gap-2 text-xs" style={{ color: '#9896b0' }}><input type="checkbox" checked={form.interestFromFirstInstallment} onChange={e => setForm(f => ({ ...f, interestFromFirstInstallment: e.target.checked }))} /> Cobra intereses desde la primera cuota</label>
                  </>
                )}

                {(form.type === 'credit' || form.type === 'pocket' || form.type === 'vault') && (
                  <div className="flex gap-3">
                    <label className="flex-1 text-xs font-medium" style={{ color: '#9896b0' }}>{form.type === 'credit' ? 'Interes' : 'Rendimiento'} (%)<input type="number" value={form.interestRate} onChange={e => setForm(f => ({ ...f, interestRate: e.target.value }))} className="mt-1.5 w-full rounded-xl px-3 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff' }} /></label>
                    <label className="w-28 text-xs font-medium" style={{ color: '#9896b0' }}>Periodo<select value={form.interestPeriod} onChange={e => setForm(f => ({ ...f, interestPeriod: e.target.value as 'EA' | 'MV' }))} className="mt-1.5 w-full rounded-xl px-3 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff' }}><option>EA</option><option>MV</option></select></label>
                  </div>
                )}

                {form.type === 'vault' && <div className="flex gap-3">
                  <label className="flex-1 text-xs font-medium" style={{ color: '#9896b0' }}>Fecha inicial<input type="date" value={form.vaultStartDate} onChange={e => setForm(f => ({ ...f, vaultStartDate: e.target.value }))} className="date-dark mt-1.5 w-full rounded-xl px-3 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', colorScheme: 'dark' }} /></label>
                  <label className="flex-1 text-xs font-medium" style={{ color: '#9896b0' }}>Fecha limite<input type="date" value={form.vaultEndDate} onChange={e => setForm(f => ({ ...f, vaultEndDate: e.target.value }))} className="date-dark mt-1.5 w-full rounded-xl px-3 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', colorScheme: 'dark' }} /></label>
                </div>}

                {(form.type === 'debit' || form.type === 'credit') && <label className="flex items-center gap-2 text-xs" style={{ color: '#9896b0' }}><input type="checkbox" checked={form.includeInBalance} onChange={e => setForm(f => ({ ...f, includeInBalance: e.target.checked }))} /> Incluir en balance total</label>}

                <div>
                  <span className="text-xs font-medium block mb-2" style={{ color: '#9896b0' }}>Color</span>
                  <div className="flex gap-2 flex-wrap">{CATEGORY_COLORS.map(c => <button type="button" key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className="w-8 h-8 rounded-lg" style={{ background: c, border: `2px solid ${form.color === c ? 'white' : 'transparent'}` }} />)}</div>
                </div>

                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={resetForm} className="flex-1 py-3.5 rounded-2xl text-sm font-medium" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#9896b0' }}>Cancelar</button>
                  <button type="submit" className="flex-1 py-3.5 rounded-2xl text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #7c6af7, #ec4899)', border: 'none', color: 'white' }}>{editingId ? 'Guardar' : 'Crear'}</button>
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
