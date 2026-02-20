'use client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface DayData {
  date: string;
  income: number;
  expense: number;
}

interface MiniChartProps {
  data: DayData[];
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

function formatCOP(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#18181f',
        border: '1px solid #2a2a38',
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
        fontSize: '0.75rem',
      }}>
        <p style={{ color: '#9896b0', marginBottom: '0.5rem' }}>{formatShortDate(label)}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.name === 'income' ? '#22c55e' : '#f43f5e', fontWeight: 600 }}>
            {p.name === 'income' ? '↑' : '↓'} {formatCOP(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function MiniChart({ data }: MiniChartProps) {
  if (!data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-4 mt-4 rounded-2xl p-5"
        style={{ background: '#111118', border: '1px solid #1e1e28' }}
      >
        <p className="text-xs font-semibold mb-4" style={{ color: '#9896b0' }}>Actividad reciente</p>
        <div className="flex items-center justify-center h-24" style={{ color: '#5a5870', fontSize: '0.8rem' }}>
          Sin datos aún
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mx-4 mt-4 rounded-2xl p-5"
      style={{ background: '#111118', border: '1px solid #1e1e28' }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold" style={{ color: '#9896b0' }}>Últimos 30 días</p>
        <div className="flex items-center gap-3 text-xs">
          <span style={{ color: '#22c55e' }}>● Ingresos</span>
          <span style={{ color: '#f43f5e' }}>● Gastos</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={100}>
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: '#5a5870', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => {
              const d = new Date(v + 'T00:00:00');
              return `${d.getDate()}`;
            }}
            interval="preserveStartEnd"
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} fill="url(#incomeGrad)" dot={false} />
          <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} fill="url(#expenseGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
