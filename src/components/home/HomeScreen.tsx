import { useState, useEffect, useCallback } from 'react';
import BalanceCard from './BalanceCard';
import RecentTransactions from './RecentTransactions';
import VoiceButton from '../input/VoiceButton';
import TextInput from '../input/TextInput';
import AIModal from '../input/AIModal';
import AppShell from '../layout/AppShell';

interface StatsData {
  totalBalance: number;
  income: number;
  expenses: number;
  wallets: any[];
}

export default function HomeScreen() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [interpretation, setInterpretation] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [interpreting, setInterpreting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, txRes] = await Promise.all([
        fetch('/api/stats?period=all'),
        fetch('/api/transactions?limit=10'),
      ]);
      const [statsData, txData] = await Promise.all([statsRes.json(), txRes.json()]);
      setStats(statsData.data);
      setTransactions(txData.data ?? []);
      setWallets(statsData.data?.wallets ?? []);
    } catch {
      showToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleTextOrVoice = async (text: string) => {
    setInterpreting(true);
    try {
      const res = await fetch('/api/ai/interpret', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? 'Error al interpretar');
      if (data.data?.action === 'delete_transaction') {
        if (!data.data.targetTransactionId) throw new Error(data.data.clarification ?? 'No encontre cual movimiento eliminar');
        await handleDelete(data.data.targetTransactionId);
        return;
      }
      setInterpretation(data.data);
      setModalOpen(true);
    } catch (e: any) {
      showToast(e.message ?? 'Error al interpretar', 'error');
    } finally {
      setInterpreting(false);
    }
  };

  const handleConfirm = async (txData: any) => {
    const res = await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(txData) });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error ?? 'Error al guardar');
    }
    setModalOpen(false);
    setInterpretation(null);
    showToast('Transaccion guardada');
    await fetchAll();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
    showToast('Transaccion eliminada');
    await fetchAll();
  };

  return (
    <AppShell currentPath="/" title="Inicio">
      <div className="pb-8">
        {loading ? (
          <div className="px-4 mt-5 flex flex-col gap-4">
            <div className="skeleton h-48 rounded-2xl" />
            <div className="skeleton h-28 rounded-2xl" />
            <div className="skeleton h-16 rounded-2xl" />
          </div>
        ) : (
          <>
            {stats && <BalanceCard totalBalance={stats.totalBalance} income={stats.income} expenses={stats.expenses} wallets={stats.wallets} onRefresh={fetchAll} />}
          </>
        )}

        <div className="mx-4 mt-5 rounded-2xl p-5" style={{ background: '#111118', border: '1px solid #1e1e28' }}>
          <p className="text-xs font-semibold mb-4 text-center" style={{ color: '#9896b0' }}>Registrar movimiento</p>
          <div className="flex justify-center mb-5">
            <VoiceButton onTranscribed={handleTextOrVoice} disabled={interpreting} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div style={{ flex: 1, height: '1px', background: '#1e1e28' }} />
            <span className="text-xs" style={{ color: '#5a5870' }}>o escribe</span>
            <div style={{ flex: 1, height: '1px', background: '#1e1e28' }} />
          </div>
          <TextInput onSubmit={handleTextOrVoice} disabled={interpreting} />
          {interpreting && <p className="mt-3 text-xs text-center" style={{ color: '#7c6af7' }}>Analizando...</p>}
        </div>

        {!loading && <RecentTransactions transactions={transactions} onDelete={handleDelete} />}
      </div>

      <AIModal isOpen={modalOpen} interpretation={interpretation} wallets={wallets} onConfirm={handleConfirm} onCancel={() => { setModalOpen(false); setInterpretation(null); }} />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[100] px-5 py-3 rounded-2xl text-sm font-medium" style={{ transform: 'translateX(-50%)', background: toast.type === 'success' ? '#18181f' : '#2a0e14', border: `1px solid ${toast.type === 'success' ? '#2a2a38' : '#f43f5e40'}`, color: toast.type === 'success' ? '#f1f0ff' : '#f43f5e', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
          {toast.msg}
        </div>
      )}
    </AppShell>
  );
}
