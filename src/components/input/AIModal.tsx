import { useEffect, useState } from 'react';
import { formatNumberInput, parseNumberInput, walletLogo } from '../../lib/utils';

interface AIInterpretation {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  description: string;
  expenseKind?: 'fixed' | 'variable' | 'mismatch' | null;
  wallet: { id: number | null; name: string; emoji: string; exists: boolean };
  walletDestination?: { id: number | null; name: string; emoji: string; exists: boolean } | null;
  clarification?: string | null;
  rawText: string;
}

interface Wallet {
  id: number;
  name: string;
  emoji: string;
  type?: string;
  interestRate?: number;
  interestPeriod?: string;
  interestFromFirstInstallment?: boolean;
}

interface AIModalProps {
  interpretation: AIInterpretation | null;
  wallets: Wallet[];
  onConfirm: (data: any) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
}

const typeLabels = { income: 'Ingreso', expense: 'Gasto', transfer: 'Transferencia' };
const typeColors = { income: '#22c55e', expense: '#f43f5e', transfer: '#3b82f6' };
const expenseKindLabels = { fixed: 'Fijo', variable: 'Variable', mismatch: 'Descuadre' };

function WalletMark({ wallet }: { wallet: Wallet }) {
  const logo = walletLogo(wallet.emoji, wallet.name);
  return logo ? <img src={logo} alt="" className="h-5 w-5 object-contain" /> : <span className="text-base">{wallet.emoji}</span>;
}

export default function AIModal({ interpretation, wallets, onConfirm, onCancel, isOpen }: AIModalProps) {
  const [editedData, setEditedData] = useState<AIInterpretation | null>(null);
  const [loading, setLoading] = useState(false);
  const [installments, setInstallments] = useState(1);
  const [interestApplied, setInterestApplied] = useState(false);
  const data = editedData ?? interpretation;

  useEffect(() => {
    setEditedData(null);
    setInstallments(1);
    setInterestApplied(false);
  }, [interpretation]);

  if (!isOpen || !data) return null;

  const needsNewWallet = data.wallet && !data.wallet.exists;
  const selectedWallet = wallets.find(w => w.id === data.wallet?.id);
  const isCreditExpense = selectedWallet?.type === 'credit' && data.type === 'expense';
  const monthlyRate = selectedWallet?.interestPeriod === 'MV'
    ? (selectedWallet.interestRate ?? 0) / 100
    : Math.pow(1 + (selectedWallet?.interestRate ?? 0) / 100, 1 / 12) - 1;
  const installmentEstimate = installments > 1
    ? interestApplied
      ? data.amount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -installments))
      : data.amount / installments
    : data.amount;
  const update = (patch: Partial<AIInterpretation>) => setEditedData(prev => ({ ...(prev ?? interpretation!), ...patch }));

  const handleConfirm = async () => {
    setLoading(true);
    try {
      let walletId = data.wallet?.id ?? null;

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
        expenseKind: data.type === 'expense' ? data.expenseKind : null,
        walletId,
        walletDestinationId: data.walletDestination?.id ?? null,
        description: data.description,
        aiGenerated: true,
        rawInput: data.rawText,
        installments,
        interestApplied,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.7)', border: 0 }} onClick={onCancel} aria-label="Cancelar" />
      <div className="fixed inset-0 z-50 flex items-end justify-center pb-[5%] px-4 pointer-events-none">
        <div className="w-full rounded-3xl overflow-y-auto pointer-events-auto" style={{ maxWidth: '440px', maxHeight: '85dvh', background: '#111118', border: '1px solid #2a2a38' }}>
          <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid #1e1e28' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: `${typeColors[data.type]}18`, color: typeColors[data.type] }}>
                {typeLabels[data.type]}
              </span>
              <button onClick={onCancel} style={{ color: '#5a5870', background: 'none', border: 'none', cursor: 'pointer' }}>x</button>
            </div>
            <p className="text-xs mt-1" style={{ color: '#5a5870' }}>"{data.rawText}"</p>
          </div>

          <div className="p-5 flex flex-col gap-4">
            <div>
              <label htmlFor="ai-amount" className="text-xs font-medium mb-1.5 block" style={{ color: '#9896b0' }}>Monto</label>
              <div className="flex items-center gap-2">
                <input id="ai-amount" inputMode="numeric" value={formatNumberInput(data.amount)} onChange={e => update({ amount: parseNumberInput(e.target.value) })} className="flex-1 rounded-xl px-4 py-3 text-lg font-bold outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: typeColors[data.type], fontFamily: 'inherit' }} />
                <select aria-label="Moneda" value={data.currency} onChange={e => update({ currency: e.target.value })} className="rounded-xl px-3 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', fontFamily: 'inherit' }}>
                  <option>COP</option><option>USD</option><option>EUR</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="ai-desc" className="text-xs font-medium mb-1.5 block" style={{ color: '#9896b0' }}>Descripcion</label>
              <input id="ai-desc" value={data.description} onChange={e => update({ description: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', fontFamily: 'inherit' }} />
            </div>

            <div>
              <span className="text-xs font-medium mb-1.5 block" style={{ color: '#9896b0' }}>Tipo</span>
              <div className="flex gap-2">
                {(['expense', 'income', 'transfer'] as const).map(t => (
                  <button key={t} onClick={() => update({ type: t })} className="flex-1 py-2.5 rounded-xl text-xs font-medium" style={{ background: data.type === t ? `${typeColors[t]}20` : '#18181f', border: `1px solid ${data.type === t ? typeColors[t] : '#2a2a38'}`, color: data.type === t ? typeColors[t] : '#9896b0', cursor: 'pointer' }}>
                    {typeLabels[t]}
                  </button>
                ))}
              </div>
            </div>

            {data.type === 'expense' && (
              <div>
                <span className="text-xs font-medium mb-1.5 block" style={{ color: '#9896b0' }}>Tipo de gasto</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['fixed', 'variable', 'mismatch'] as const).map(kind => (
                    <button type="button" key={kind} onClick={() => update({ expenseKind: kind })} className="rounded-xl px-3 py-3 text-sm font-medium" style={{ background: data.expenseKind === kind ? 'rgba(124,106,247,0.2)' : '#18181f', border: `1px solid ${data.expenseKind === kind ? '#7c6af7' : '#2a2a38'}`, color: data.expenseKind === kind ? '#f1f0ff' : '#9896b0' }}>
                      {expenseKindLabels[kind]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="text-xs font-medium mb-1.5 block" style={{ color: '#9896b0' }}>{data.type === 'transfer' ? 'Billetera origen' : 'Billetera'}</span>
              {needsNewWallet ? (
                <div className="rounded-xl p-3" style={{ background: '#18181f', border: '1px solid rgba(234,179,8,0.3)', color: '#f1f0ff' }}>Se creara: {data.wallet.emoji} {data.wallet.name}</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {wallets.filter(w => w.type !== 'vault').map(w => (
                    <button type="button" key={w.id} onClick={() => update({ wallet: { id: w.id, name: w.name, emoji: w.emoji, exists: true } })} className="flex items-center gap-2 min-w-0 rounded-xl px-3 py-3 text-sm" style={{ background: data.wallet?.id === w.id ? 'rgba(124,106,247,0.2)' : '#18181f', border: `1px solid ${data.wallet?.id === w.id ? '#7c6af7' : '#2a2a38'}`, color: '#f1f0ff' }}>
                      <WalletMark wallet={w} />
                      <span className="truncate">{w.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {data.type === 'transfer' && (
              <div>
                <span className="text-xs font-medium mb-1.5 block" style={{ color: '#9896b0' }}>Billetera destino</span>
                <div className="grid grid-cols-2 gap-2">
                  {wallets.filter(w => w.type !== 'vault' && w.id !== data.wallet?.id).map(w => (
                    <button type="button" key={w.id} onClick={() => update({ walletDestination: { id: w.id, name: w.name, emoji: w.emoji, exists: true } })} className="flex items-center gap-2 min-w-0 rounded-xl px-3 py-3 text-sm" style={{ background: data.walletDestination?.id === w.id ? 'rgba(59,130,246,0.2)' : '#18181f', border: `1px solid ${data.walletDestination?.id === w.id ? '#3b82f6' : '#2a2a38'}`, color: '#f1f0ff' }}>
                      <WalletMark wallet={w} />
                      <span className="truncate">{w.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isCreditExpense && (
              <div className="rounded-xl p-3" style={{ background: '#18181f', border: '1px solid #2a2a38' }}>
                <p className="text-xs font-medium mb-2" style={{ color: '#9896b0' }}>Compra con tarjeta de credito</p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label htmlFor="ai-installments" className="text-xs block mb-1" style={{ color: '#9896b0' }}>Cuotas</label>
                    <input id="ai-installments" type="number" min="1" value={installments} onChange={e => setInstallments(Math.max(1, parseInt(e.target.value || '1')))} className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={{ background: '#111118', border: '1px solid #2a2a38', color: '#f1f0ff' }} />
                  </div>
                  <label className="flex items-end gap-2 pb-2 text-xs" style={{ color: '#9896b0' }}>
                    <input type="checkbox" checked={interestApplied || selectedWallet?.interestFromFirstInstallment === true} onChange={e => setInterestApplied(e.target.checked)} />
                    Cobra interes
                  </label>
                </div>
                <p className="text-xs mt-2" style={{ color: '#7c6af7' }}>
                  Estimado: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: data.currency, maximumFractionDigits: 0 }).format(installmentEstimate)} x {installments}
                </p>
              </div>
            )}
          </div>

          <div className="px-5 pb-6 flex gap-3">
            <button onClick={onCancel} className="flex-1 py-3.5 rounded-2xl text-sm font-medium" style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#9896b0', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleConfirm} disabled={loading || !data.amount || (!data.wallet?.id && !needsNewWallet) || (data.type === 'transfer' && !data.walletDestination?.id)} className="flex-1 py-3.5 rounded-2xl text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #7c6af7, #ec4899)', border: 'none', color: 'white', cursor: loading ? 'wait' : 'pointer' }}>
              {loading ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
