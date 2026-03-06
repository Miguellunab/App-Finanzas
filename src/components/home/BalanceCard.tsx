import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);
}

interface BalanceCardProps {
  totalBalance: number;
  income: number;
  expenses: number;
  currency?: string;
  wallets: Array<{ id: number; name: string; emoji: string; color: string; balance: number; currency: string }>;
}

export default function BalanceCard({ totalBalance, income, expenses, wallets }: BalanceCardProps) {
  const animatedBalance = useCountUp(totalBalance);
  const animatedIncome = useCountUp(income);
  const animatedExpenses = useCountUp(expenses);
  const [showWallets, setShowWallets] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-4 mt-5 rounded-2xl overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, #1a1530 0%, #12112a 50%, #0f1528 100%)',
        border: '1px solid rgba(124,106,247,0.3)',
        boxShadow: '0 8px 32px rgba(124,106,247,0.12)',
      }}
    >
      {/* Background SVG Waves */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" preserveAspectRatio="none" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="card-wave" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c6af7" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <motion.path
          d="M 0,100 C 100,200 300,0 400,100 L 400,200 L 0,200 Z"
          fill="url(#card-wave)"
          animate={{
            d: [
              "M 0,100 C 100,200 300,0 400,100 L 400,200 L 0,200 Z",
              "M 0,150 C 150,50 250,250 400,150 L 400,200 L 0,200 Z",
              "M 0,100 C 100,200 300,0 400,100 L 400,200 L 0,200 Z",
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>

      {/* Balance principal */}
      <div className="p-6 pb-4 relative z-10">
        <p className="text-xs font-medium tracking-wider uppercase mb-3" style={{ color: '#5a5870' }}>
          Balance Total
        </p>
        <motion.p
          className="text-4xl font-bold tracking-tight"
          style={{ color: '#f1f0ff', fontVariantNumeric: 'tabular-nums' }}
        >
          {formatCOP(animatedBalance)}
        </motion.p>

        {/* Income / Expense row */}
        <div className="flex gap-4 mt-5">
          <div className="flex-1 rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs" style={{ color: '#22c55e' }}>↑</span>
              <span className="text-xs font-medium" style={{ color: '#22c55e' }}>Ingresos</span>
            </div>
            <p className="text-sm font-bold" style={{ color: '#f1f0ff' }}>{formatCOP(animatedIncome)}</p>
          </div>
          <div className="flex-1 rounded-xl p-3" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs" style={{ color: '#f43f5e' }}>↓</span>
              <span className="text-xs font-medium" style={{ color: '#f43f5e' }}>Gastos</span>
            </div>
            <p className="text-sm font-bold" style={{ color: '#f1f0ff' }}>{formatCOP(animatedExpenses)}</p>
          </div>
        </div>
      </div>

      {/* Wallets expandibles */}
      <button
        onClick={() => setShowWallets(v => !v)}
        className="w-full flex items-center justify-between px-6 py-3 text-xs font-medium transition-colors relative z-10"
        style={{
          color: '#9896b0',
          borderTop: '1px solid rgba(124,106,247,0.15)',
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        <span>{wallets.length} billetera{wallets.length !== 1 ? 's' : ''}</span>
        <motion.span animate={{ rotate: showWallets ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </motion.span>
      </button>

      <AnimatePresence>
        {showWallets && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="px-4 pb-4 flex flex-col gap-2 relative z-10 overflow-hidden"
          >
            {wallets.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{w.emoji}</span>
                  <span className="text-sm font-medium" style={{ color: '#d4d2f0' }}>{w.name}</span>
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ color: w.balance >= 0 ? '#f1f0ff' : '#f43f5e' }}
                >
                  {formatCOP(w.balance)}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
