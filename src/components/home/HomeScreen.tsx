import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BalanceCard from './BalanceCard';
import MiniChart from './MiniChart';
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
  byDay: any[];
}

export default function HomeScreen() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
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
      const [statsRes, txRes, walletsRes, catsRes] = await Promise.all([
        fetch('/api/stats?period=month'),
        fetch('/api/transactions?limit=10'),
        fetch('/api/wallets'),
        fetch('/api/categories'),
      ]);
      const [statsData, txData, walletsData, catsData] = await Promise.all([
        statsRes.json(), txRes.json(), walletsRes.json(), catsRes.json(),
      ]);
      setStats(statsData.data);
      setTransactions(txData.data ?? []);
      setWallets(walletsData.data ?? []);
      setCategories(catsData.data ?? []);
    } catch (e) {
      showToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleTextOrVoice = async (text: string) => {
    setInterpreting(true);
    try {
      const res = await fetch('/api/ai/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      setInterpretation(data.data);
      setModalOpen(true);
    } catch (e: any) {
      showToast(e.message ?? 'Error al interpretar', 'error');
    } finally {
      setInterpreting(false);
    }
  };

  const handleConfirm = async (txData: any) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txData),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error ?? 'Error al guardar');
    }
    setModalOpen(false);
    setInterpretation(null);
    showToast('✓ Transacción guardada');
    await fetchAll();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
    showToast('Transacción eliminada');
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
            {stats && (
              <BalanceCard
                totalBalance={stats.totalBalance}
                income={stats.income}
                expenses={stats.expenses}
                wallets={stats.wallets}
              />
            )}
            {stats && <MiniChart data={stats.byDay} />}
            <RecentTransactions transactions={transactions} onDelete={handleDelete} />
          </>
        )}

        {/* Sección de input IA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mx-4 mt-5 rounded-2xl p-5"
          style={{ background: '#111118', border: '1px solid #1e1e28' }}
        >
          <p className="text-xs font-semibold mb-4 text-center" style={{ color: '#5a5870' }}>
            Registrar movimiento
          </p>

          {/* Voice button centrado */}
          <div className="flex justify-center mb-5">
            <VoiceButton onTranscribed={handleTextOrVoice} disabled={interpreting} />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div style={{ flex: 1, height: '1px', background: '#1e1e28' }} />
            <span className="text-xs" style={{ color: '#5a5870' }}>o escribe</span>
            <div style={{ flex: 1, height: '1px', background: '#1e1e28' }} />
          </div>

          <TextInput onSubmit={handleTextOrVoice} disabled={interpreting} />

          {/* Estado interpretando */}
          <AnimatePresence>
            {interpreting && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 flex items-center gap-2 justify-center"
              >
                <motion.div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#7c6af7' }}
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                />
                <motion.div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#7c6af7' }}
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                />
                <motion.div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#7c6af7' }}
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                />
                <span className="text-xs ml-1" style={{ color: '#7c6af7' }}>Analizando con IA...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Modal de confirmación IA */}
      <AIModal
        isOpen={modalOpen}
        interpretation={interpretation}
        wallets={wallets}
        categories={categories}
        onConfirm={handleConfirm}
        onCancel={() => { setModalOpen(false); setInterpretation(null); }}
      />

      {/* Toast notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
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
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
