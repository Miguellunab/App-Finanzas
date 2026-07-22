import { useEffect, useState } from 'react';
import { formatNumberInput, parseNumberInput, walletLogo } from '../../lib/utils';

interface Wallet {
  id: number;
  name: string;
  emoji: string;
  type?: string;
}

interface CardPayment {
  kind: 'card';
  key: string;
  walletId: number;
  name: string;
  emoji: string;
  currency: string;
  amount: number;
  principal: number;
  interest: number;
  periodStart: string;
  periodEnd: string;
}

interface SubscriptionPayment {
  kind: 'subscription';
  key: string;
  subscriptionId: number;
  name: string;
  currency: string;
  amount: number;
  chargeDate: string;
  defaultWalletId: number;
  defaultWalletName?: string | null;
  defaultWalletEmoji?: string | null;
}

type PendingPayment = CardPayment | SubscriptionPayment;

interface PendingPaymentsProps {
  payments: PendingPayment[];
  wallets: Wallet[];
  onRefresh: () => Promise<void>;
  onMessage: (message: string, type?: 'success' | 'error') => void;
}

function money(amount: number, currency = 'COP') {
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

function date(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

function WalletMark({ wallet }: { wallet?: { emoji?: string | null; name?: string | null } }) {
  const logo = walletLogo(wallet?.emoji ?? '', wallet?.name ?? '');
  return logo ? <img src={logo} alt="" className="h-5 w-5 object-contain" /> : <span>{wallet?.emoji ?? '💳'}</span>;
}

export default function PendingPayments({ payments, wallets, onRefresh, onMessage }: PendingPaymentsProps) {
  const [selected, setSelected] = useState<PendingPayment | null>(null);
  const [amount, setAmount] = useState('');
  const [sourceWalletId, setSourceWalletId] = useState('');
  const [working, setWorking] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const sourceWallets = selected
    ? wallets.filter(wallet => wallet.type !== 'vault' && (selected.kind !== 'card' || (wallet.type !== 'credit' && wallet.id !== selected.walletId)))
    : [];

  useEffect(() => {
    if (!selected) return;
    const preferred = selected.kind === 'subscription'
      ? wallets.find(wallet => wallet.id === selected.defaultWalletId && wallet.type !== 'vault')
      : wallets.find(wallet => wallet.type !== 'vault' && wallet.type !== 'credit' && wallet.name.toLowerCase().includes('bancolombia'))
        ?? wallets.find(wallet => wallet.type !== 'vault' && wallet.type !== 'credit');
    setAmount(formatNumberInput(selected.amount));
    setSourceWalletId(preferred ? String(preferred.id) : '');
    setModalError(null);
  }, [selected, wallets]);

  if (payments.length === 0) return null;

  const closeModal = () => {
    if (!working) setSelected(null);
  };

  const settle = async (payment: PendingPayment, action: 'paid' | 'cancel') => {
    setWorking(payment.key);
    try {
      const body = payment.kind === 'card'
        ? { kind: 'card', action, walletId: payment.walletId, periodStart: payment.periodStart, periodEnd: payment.periodEnd, amount: parseNumberInput(amount), sourceWalletId: Number(sourceWalletId) }
        : { kind: 'subscription', action, subscriptionId: payment.subscriptionId, amount: parseNumberInput(amount), sourceWalletId: Number(sourceWalletId) };
      const res = await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudo actualizar el pago');
      setSelected(null);
      onMessage(action === 'paid' ? 'Pago registrado' : 'Pago cancelado');
      await onRefresh();
    } catch (error: any) {
      if (action === 'paid') setModalError(error.message ?? 'No se pudo registrar el pago');
      else onMessage(error.message ?? 'No se pudo cancelar el pago', 'error');
    } finally {
      setWorking(null);
    }
  };

  return (
    <>
      <section className="mx-4 mt-5 rounded-2xl p-4" style={{ background: '#111118', border: '1px solid rgba(234,179,8,0.35)' }} aria-labelledby="pending-payments-title">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p id="pending-payments-title" className="text-sm font-bold" style={{ color: '#f1f0ff' }}>Pagos pendientes</p>
            <p className="text-xs mt-0.5" style={{ color: '#9896b0' }}>Registra solo los que realmente pagaste.</p>
          </div>
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ color: '#facc15', background: 'rgba(234,179,8,0.12)' }}>{payments.length}</span>
        </div>

        <div className="flex flex-col gap-2">
          {payments.map(payment => (
            <div key={payment.key} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0" style={{ background: 'rgba(124,106,247,0.14)' }}>
                  <WalletMark wallet={payment.kind === 'card' ? payment : { name: payment.defaultWalletName, emoji: payment.defaultWalletEmoji }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: '#f1f0ff' }}>{payment.kind === 'card' ? `Pagar tarjeta ${payment.name}` : payment.name}</p>
                  {payment.kind === 'card' ? (
                    <p className="text-xs mt-0.5" style={{ color: '#9896b0' }}>Del {date(payment.periodStart)} al {date(payment.periodEnd)} · {money(payment.amount, payment.currency)}</p>
                  ) : (
                    <p className="text-xs mt-0.5" style={{ color: '#9896b0' }}>Cobro del {date(payment.chargeDate)} · sugerido {money(payment.amount, payment.currency)}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button type="button" onClick={() => settle(payment, 'cancel')} disabled={working === payment.key} className="flex-1 py-2.5 rounded-xl text-xs font-medium" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#9896b0' }}>Cancelar</button>
                <button type="button" onClick={() => setSelected(payment)} disabled={working === payment.key} className="flex-1 py-2.5 rounded-xl text-xs font-semibold" style={{ background: 'rgba(124,106,247,0.18)', border: '1px solid rgba(124,106,247,0.4)', color: '#c4b5fd' }}>{payment.kind === 'card' ? 'Pagar tarjeta' : 'Registrar pago'}</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selected && (
        <>
          <button className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.7)', border: 0 }} onClick={closeModal} aria-label="Cerrar" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div role="dialog" aria-modal="true" aria-labelledby="payment-modal-title" className="w-full rounded-3xl overflow-hidden pointer-events-auto" style={{ maxWidth: '440px', background: '#111118', border: '1px solid #2a2a38' }}>
              <div className="p-5" style={{ borderBottom: '1px solid #1e1e28' }}>
                <h2 id="payment-modal-title" className="text-base font-bold" style={{ color: '#f1f0ff' }}>{selected.kind === 'card' ? `Pagar tarjeta ${selected.name}` : `Registrar ${selected.name}`}</h2>
                <p className="text-xs mt-1" style={{ color: '#9896b0' }}>Puedes ajustar el valor si hubo tarifas o una variación.</p>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <label className="text-xs font-medium" style={{ color: '#9896b0' }}>Total pagado
                  <input inputMode="numeric" value={amount} onChange={event => setAmount(formatNumberInput(event.target.value))} className="mt-1.5 w-full rounded-xl px-4 py-3 text-lg font-semibold outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff' }} />
                </label>

                <div>
                  <span className="text-xs font-medium block mb-2" style={{ color: '#9896b0' }}>Billetera de origen</span>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {sourceWallets.map(wallet => (
                      <button type="button" key={wallet.id} onClick={() => setSourceWalletId(String(wallet.id))} className="flex items-center gap-2 min-w-0 rounded-xl px-3 py-3 text-sm" style={{ background: sourceWalletId === String(wallet.id) ? 'rgba(124,106,247,0.2)' : '#18181f', border: `1px solid ${sourceWalletId === String(wallet.id) ? '#7c6af7' : '#2a2a38'}`, color: '#f1f0ff' }}>
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0" style={{ background: 'rgba(124,106,247,0.14)' }}><WalletMark wallet={wallet} /></span>
                        <span className="truncate">{wallet.name}</span>
                      </button>
                    ))}
                  </div>
                  {sourceWallets.length === 0 && <p className="text-xs" style={{ color: '#f43f5e' }}>No hay billeteras disponibles para este pago.</p>}
                </div>

                {modalError && <p className="text-xs rounded-xl px-3 py-2" style={{ color: '#fda4af', background: 'rgba(244,63,94,0.1)' }}>{modalError}</p>}
                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={closeModal} disabled={!!working} className="flex-1 py-3.5 rounded-2xl text-sm font-medium" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#9896b0' }}>Cancelar</button>
                  <button type="button" onClick={() => settle(selected, 'paid')} disabled={!!working || !sourceWalletId || parseNumberInput(amount) <= 0} className="flex-1 py-3.5 rounded-2xl text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #7c6af7, #ec4899)', border: 'none', color: 'white', opacity: !sourceWalletId || parseNumberInput(amount) <= 0 ? 0.5 : 1 }}>{working ? 'Guardando...' : 'Confirmar pago'}</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
