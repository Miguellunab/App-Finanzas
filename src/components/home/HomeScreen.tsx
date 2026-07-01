import { useState, useEffect, useCallback } from 'react';
import BalanceCard from './BalanceCard';
import MiniChart from './MiniChart';
import RecentTransactions from './RecentTransactions';
import VoiceButton from '../input/VoiceButton';
import TextInput from '../input/TextInput';
import AppShell from '../layout/AppShell';

interface StatsData {
  totalBalance: number;
  income: number;
  expenses: number;
  wallets: any[];
  byDay: any[];
}

export default function HomeScreen() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [micText, setMicText] = useState('');
  const [micLog, setMicLog] = useState('');

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
    } catch {
      showToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleTranscribed = (text: string, log?: string) => {
    setMicText(text);
    setMicLog(log ?? '');
    showToast('Audio transcrito');
  };

  const handleText = (text: string) => {
    setMicText(text);
    setMicLog('Entrada manual, sin analisis IA.');
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
            {stats && <BalanceCard totalBalance={stats.totalBalance} income={stats.income} expenses={stats.expenses} wallets={stats.wallets} />}
            {stats && <MiniChart data={stats.byDay} />}
            <RecentTransactions transactions={transactions} onDelete={handleDelete} />
          </>
        )}

        <div className="mx-4 mt-5 rounded-2xl p-5" style={{ background: '#111118', border: '1px solid #1e1e28' }}>
          <p className="text-xs font-semibold mb-4 text-center" style={{ color: '#9896b0' }}>
            Probar microfono
          </p>

          <div className="flex justify-center mb-5">
            <VoiceButton onTranscribed={handleTranscribed} onLog={setMicLog} />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div style={{ flex: 1, height: '1px', background: '#1e1e28' }} />
            <span className="text-xs" style={{ color: '#5a5870' }}>o escribe</span>
            <div style={{ flex: 1, height: '1px', background: '#1e1e28' }} />
          </div>

          <TextInput onSubmit={handleText} />

          {(micText || micLog) && (
            <div className="mt-4 rounded-xl p-3" style={{ background: '#18181f', border: '1px solid #2a2a38' }}>
              {micText && (
                <>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#22c55e' }}>Texto</p>
                  <p className="text-sm mb-3 whitespace-pre-wrap" style={{ color: '#f1f0ff' }}>{micText}</p>
                </>
              )}
              {micLog && (
                <>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#7c6af7' }}>Log completo</p>
                  <pre className="text-[11px] whitespace-pre-wrap overflow-auto max-h-64" style={{ color: '#9896b0' }}>{micLog}</pre>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-[100] px-5 py-3 rounded-2xl text-sm font-medium"
          style={{
            transform: 'translateX(-50%)',
            background: toast.type === 'success' ? '#18181f' : '#2a0e14',
            border: `1px solid ${toast.type === 'success' ? '#2a2a38' : '#f43f5e40'}`,
            color: toast.type === 'success' ? '#f1f0ff' : '#f43f5e',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          {toast.msg}
        </div>
      )}
    </AppShell>
  );
}
