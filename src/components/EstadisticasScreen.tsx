import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import AppShell from './layout/AppShell';

function formatCOP(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function formatFull(n: number, currency = 'COP') {
  try { return new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n); }
  catch { return `$${n}`; }
}

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#18181f', border: '1px solid #2a2a38', borderRadius: '0.75rem', padding: '0.6rem 1rem', fontSize: '0.75rem' }}>
        <p style={{ color: '#f1f0ff', fontWeight: 600 }}>{payload[0].name}</p>
        <p style={{ color: payload[0].fill }}>{formatFull(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#18181f', border: '1px solid #2a2a38', borderRadius: '0.75rem', padding: '0.6rem 1rem', fontSize: '0.75rem' }}>
        <p style={{ color: '#9896b0', marginBottom: 4 }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.fill, fontWeight: 600 }}>{p.name === 'income' ? '↑' : '↓'} {formatCOP(p.value)}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function EstadisticasScreen() {
  const [stats, setStats] = useState<any>(null);
  const [review, setReview] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingReview, setLoadingReview] = useState(false);
  const [period, setPeriod] = useState<'month' | 'all'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'review'>('overview');

  useEffect(() => {
    setLoadingStats(true);
    fetch(`/api/stats?period=${period}`)
      .then(r => r.json())
      .then(d => { setStats(d.data); setLoadingStats(false); })
      .catch(() => setLoadingStats(false));
  }, [period]);

  const generateReview = async () => {
    setLoadingReview(true);
    setActiveTab('review');
    try {
      const res = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      });
      const data = await res.json();
      setReview(data.review ?? data.error ?? 'Error generando análisis');
    } catch (e: any) {
      setReview('Error al conectar con la IA');
    } finally {
      setLoadingReview(false);
    }
  };

  const pieData = stats?.byCategory
    ?.filter((c: any) => c.total > 0)
    ?.map((c: any) => ({ name: `${c.categoryEmoji ?? '📦'} ${c.categoryName ?? 'Sin cat.'}`, value: c.total, color: c.categoryColor ?? '#7c6af7' }))
    ?? [];

  const barData = stats?.byDay?.map((d: any) => ({
    date: new Date(d.date + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
    income: d.income,
    expense: d.expense,
  })) ?? [];

  const savingsRate = stats?.income > 0 ? ((stats.income - stats.expenses) / stats.income * 100).toFixed(1) : '0';

  return (
    <AppShell currentPath="/estadisticas" title="Estadísticas">
      <div className="pb-8">
        {/* Period selector */}
        <div className="px-4 pt-4 flex gap-2">
          {(['month', 'all'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{ background: period === p ? '#7c6af7' : '#18181f', color: period === p ? 'white' : '#9896b0', border: `1px solid ${period === p ? 'transparent' : '#2a2a38'}`, cursor: 'pointer' }}>
              {p === 'month' ? 'Este mes' : 'Histórico'}
            </button>
          ))}
        </div>

        {/* KPIs */}
        {!loadingStats && stats && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="px-4 mt-4 grid grid-cols-2 gap-3">
            {[
              { label: 'Ingresos', value: formatFull(stats.income), color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
              { label: 'Gastos', value: formatFull(stats.expenses), color: '#f43f5e', bg: 'rgba(244,63,94,0.08)' },
              { label: 'Balance', value: formatFull(stats.balance), color: stats.balance >= 0 ? '#22c55e' : '#f43f5e', bg: 'rgba(124,106,247,0.08)' },
              { label: 'Tasa ahorro', value: `${savingsRate}%`, color: '#7c6af7', bg: 'rgba(124,106,247,0.08)' },
            ].map(kpi => (
              <div key={kpi.label} className="p-4 rounded-2xl" style={{ background: kpi.bg, border: `1px solid ${kpi.color}25` }}>
                <p className="text-xs mb-1" style={{ color: '#9896b0' }}>{kpi.label}</p>
                <p className="text-base font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex px-4 mt-5 gap-1 rounded-2xl p-1" style={{ background: '#111118', margin: '20px 16px 0' }}>
          {([['overview', 'Gráficas'], ['categories', 'Categorías'], ['review', 'IA Review']] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ background: activeTab === tab ? '#18181f' : 'transparent', color: activeTab === tab ? '#f1f0ff' : '#5a5870', cursor: 'pointer', border: 'none' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-4">
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 flex flex-col gap-4">
              {/* Gráfica de barras */}
              <div className="p-4 rounded-2xl" style={{ background: '#111118', border: '1px solid #1e1e28' }}>
                <p className="text-xs font-semibold mb-4" style={{ color: '#9896b0' }}>Ingresos vs Gastos por día</p>
                {barData.length === 0 ? (
                  <p className="text-xs text-center py-8" style={{ color: '#5a5870' }}>Sin datos</p>
                ) : (
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={barData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                      <XAxis dataKey="date" tick={{ fill: '#5a5870', fontSize: 9 }} tickLine={false} axisLine={false} />
                      <YAxis hide />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={20} />
                      <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Distribución de gastos */}
              {pieData.length > 0 && (
                <div className="p-4 rounded-2xl" style={{ background: '#111118', border: '1px solid #1e1e28' }}>
                  <p className="text-xs font-semibold mb-4" style={{ color: '#9896b0' }}>Distribución de gastos</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                        dataKey="value" paddingAngle={3}>
                        {pieData.map((entry: any, index: number) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'categories' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 flex flex-col gap-2">
              {stats?.byCategory?.length === 0 ? (
                <p className="text-center py-10 text-sm" style={{ color: '#9896b0' }}>Sin datos de categorías</p>
              ) : (
                stats?.byCategory?.map((cat: any, i: number) => {
                  const pct = stats.expenses > 0 ? (cat.total / stats.expenses * 100) : 0;
                  const overBudget = cat.budgetLimit && cat.total > cat.budgetLimit;
                  return (
                    <motion.div key={cat.categoryId ?? i}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="p-4 rounded-2xl" style={{ background: '#111118', border: `1px solid ${overBudget ? '#f43f5e40' : '#1e1e28'}` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{cat.categoryEmoji ?? '📦'}</span>
                          <span className="text-sm font-medium" style={{ color: '#f1f0ff' }}>{cat.categoryName ?? 'Sin categoría'}</span>
                          {overBudget && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(244,63,94,0.15)', color: '#f43f5e' }}>⚠ Límite</span>}
                        </div>
                        <span className="text-sm font-bold" style={{ color: overBudget ? '#f43f5e' : '#f1f0ff' }}>
                          {formatFull(cat.total)}
                        </span>
                      </div>
                      <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: '#1e1e28' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }}
                          transition={{ duration: 0.6, delay: i * 0.04 }}
                          style={{ height: '100%', background: cat.categoryColor ?? '#7c6af7', borderRadius: '99px' }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs" style={{ color: '#5a5870' }}>{pct.toFixed(1)}% del total</span>
                        {cat.budgetLimit && (
                          <span className="text-xs" style={{ color: '#5a5870' }}>Límite: {formatFull(cat.budgetLimit)}</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {activeTab === 'review' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4">
              {!review && !loadingReview ? (
                <div className="flex flex-col items-center py-10 gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                    style={{ background: 'linear-gradient(135deg, rgba(124,106,247,0.2), rgba(236,72,153,0.2))', border: '1px solid rgba(124,106,247,0.3)' }}>
                    🤖
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold mb-1" style={{ color: '#f1f0ff' }}>Análisis con IA</p>
                    <p className="text-xs" style={{ color: '#9896b0' }}>Llama 3.3 70B analizará tus finanzas del período</p>
                  </div>
                  <motion.button onClick={generateReview} whileTap={{ scale: 0.97 }}
                    className="px-6 py-3.5 rounded-2xl text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg, #7c6af7, #ec4899)', border: 'none', color: 'white', cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,106,247,0.3)' }}>
                    Generar análisis ✨
                  </motion.button>
                </div>
              ) : loadingReview ? (
                <div className="flex flex-col items-center py-12 gap-4">
                  <div className="flex gap-2">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: '#7c6af7' }}
                        animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }} />
                    ))}
                  </div>
                  <p className="text-sm" style={{ color: '#9896b0' }}>Analizando tus finanzas...</p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl"
                  style={{ background: '#111118', border: '1px solid rgba(124,106,247,0.2)' }}>
                  <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid #1e1e28' }}>
                    <span className="text-lg">🤖</span>
                    <span className="text-xs font-semibold" style={{ color: '#7c6af7' }}>Análisis de Llama 3.3 70B</span>
                    <button onClick={() => setReview(null)}
                      className="ml-auto p-1.5 rounded-lg" style={{ background: 'rgba(124,106,247,0.1)', border: 'none', cursor: 'pointer', color: '#7c6af7' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
                      </svg>
                    </button>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#d4d2f0' }}>
                    {review}
                  </div>
                  <button onClick={generateReview}
                    className="mt-4 w-full py-2.5 rounded-xl text-xs font-medium"
                    style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.2)', color: '#7c6af7', cursor: 'pointer' }}>
                    Regenerar análisis
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
