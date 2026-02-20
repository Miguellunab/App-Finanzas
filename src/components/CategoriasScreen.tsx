import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from './layout/AppShell';
import { CATEGORY_COLORS } from '../lib/utils';

interface Category {
  id: number;
  name: string;
  emoji: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  budgetLimit: number | null;
}

const TYPE_LABELS = { income: 'Ingreso', expense: 'Gasto', both: 'Ambos' };
const TYPE_COLORS = { income: '#22c55e', expense: '#f43f5e', both: '#7c6af7' };
const EMOJIS = ['📦','🛒','🚌','🎮','❤️‍🩹','📚','👕','🏠','💼','💰','💡','📱','🐾','✈️','🍽️','☕','🎵','🏋️','🎁','💄','🚗','⚡','🏥','🎓','🍕','🎪'];

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
}

export default function CategoriasScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'both'>('all');
  const [form, setForm] = useState<{ name: string; emoji: string; color: string; type: 'expense' | 'income' | 'both'; budgetLimit: string }>({ name: '', emoji: '📦', color: '#8b5cf6', type: 'expense', budgetLimit: '' });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchCats = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCats(); }, []);

  const resetForm = () => {
    setForm({ name: '', emoji: '📦', color: '#8b5cf6', type: 'expense', budgetLimit: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    const body = {
      ...(editingId ? { id: editingId } : {}),
      name: form.name, emoji: form.emoji, color: form.color, type: form.type,
      budgetLimit: form.budgetLimit ? parseFloat(form.budgetLimit) : null,
    };
    await fetch('/api/categories', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    showToast(editingId ? '✓ Categoría actualizada' : '✓ Categoría creada');
    resetForm();
    fetchCats();
  };

  const handleEdit = (c: Category) => {
    setForm({ name: c.name, emoji: c.emoji, color: c.color, type: c.type as any, budgetLimit: c.budgetLimit ? String(c.budgetLimit) : '' });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
    showToast('Categoría archivada');
    fetchCats();
  };

  const filtered = filterType === 'all' ? categories : categories.filter(c => c.type === filterType || c.type === 'both');

  return (
    <AppShell currentPath="/categorias" title="Categorías">
      <div className="pb-8">
        {/* Filtros */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {(['all', 'expense', 'income', 'both'] as const).map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: filterType === t ? (t === 'all' ? '#7c6af7' : TYPE_COLORS[t]) : '#18181f',
                  color: filterType === t ? 'white' : '#9896b0',
                  border: `1px solid ${filterType === t ? 'transparent' : '#2a2a38'}`,
                  cursor: 'pointer',
                }}>
                {t === 'all' ? 'Todas' : TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div className="px-4 mt-2 flex flex-col gap-3">
          {loading ? (
            [...Array(6)].map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">🏷️</p>
              <p className="text-sm" style={{ color: '#9896b0' }}>Sin categorías</p>
            </div>
          ) : (
            filtered.map((cat, i) => (
              <motion.div key={cat.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-4 rounded-2xl"
                style={{ background: '#111118', border: '1px solid #1e1e28' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: `${cat.color}20`, border: `1px solid ${cat.color}40` }}>
                  {cat.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: '#f1f0ff' }}>{cat.name}</p>
                    <span className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{ background: `${TYPE_COLORS[cat.type]}15`, color: TYPE_COLORS[cat.type] }}>
                      {TYPE_LABELS[cat.type]}
                    </span>
                  </div>
                  {cat.budgetLimit && (
                    <p className="text-xs mt-0.5" style={{ color: '#5a5870' }}>
                      Límite: {formatCOP(cat.budgetLimit)}/mes
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => handleEdit(cat)}
                    className="p-2 rounded-xl" style={{ background: 'rgba(124,106,247,0.1)', border: 'none', cursor: 'pointer', color: '#7c6af7' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(cat.id)}
                    className="p-2 rounded-xl" style={{ background: 'rgba(244,63,94,0.1)', border: 'none', cursor: 'pointer', color: '#f43f5e' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Botón agregar */}
        <div className="px-4 mt-4">
          <motion.button onClick={() => { resetForm(); setShowForm(true); }} whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #7c6af7, #ec4899)', border: 'none', color: 'white', cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,106,247,0.3)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva Categoría
          </motion.button>
        </div>
      </div>

      {/* Modal formulario */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetForm} />
            <div className="fixed inset-0 z-50 flex items-end justify-center pb-[3%] px-4 pointer-events-none">
            <motion.div
              className="w-full rounded-3xl overflow-y-auto pointer-events-auto"
              style={{ maxWidth: '440px', maxHeight: '85dvh', background: '#111118', border: '1px solid #2a2a38' }}
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            >
              <div className="p-5" style={{ borderBottom: '1px solid #1e1e28' }}>
                <h2 className="text-base font-bold" style={{ color: '#f1f0ff' }}>
                  {editingId ? 'Editar categoría' : 'Nueva categoría'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                {/* Emoji */}
                <div>
                  <span className="text-xs font-medium block mb-2" style={{ color: '#9896b0' }}>Emoji</span>
                  <div className="flex flex-wrap gap-2">
                    {EMOJIS.map(e => (
                      <button type="button" key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                        className="w-9 h-9 rounded-xl text-lg flex items-center justify-center"
                        style={{ background: form.emoji === e ? 'rgba(124,106,247,0.2)' : '#18181f', border: `1px solid ${form.emoji === e ? '#7c6af7' : '#2a2a38'}`, cursor: 'pointer' }}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nombre */}
                <div>
                  <label htmlFor="cat-name" className="text-xs font-medium block mb-1.5" style={{ color: '#9896b0' }}>Nombre</label>
                  <input id="cat-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Comida, Transporte..."
                    required className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', fontFamily: 'inherit' }} />
                </div>

                {/* Color */}
                <div>
                  <span className="text-xs font-medium block mb-2" style={{ color: '#9896b0' }}>Color</span>
                  <div className="flex gap-2 flex-wrap">
                    {CATEGORY_COLORS.map(c => (
                      <button type="button" key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                        className="w-8 h-8 rounded-lg"
                        style={{ background: c, border: `2px solid ${form.color === c ? 'white' : 'transparent'}`, cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>

                {/* Tipo */}
                <div>
                  <span className="text-xs font-medium block mb-2" style={{ color: '#9896b0' }}>Tipo</span>
                  <div className="flex gap-2">
                    {(['expense', 'income', 'both'] as const).map(t => (
                      <button type="button" key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                        className="flex-1 py-2.5 rounded-xl text-xs font-medium"
                        style={{ background: form.type === t ? `${TYPE_COLORS[t]}20` : '#18181f', border: `1px solid ${form.type === t ? TYPE_COLORS[t] : '#2a2a38'}`, color: form.type === t ? TYPE_COLORS[t] : '#9896b0', cursor: 'pointer' }}>
                        {TYPE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Límite de presupuesto */}
                <div>
                  <label htmlFor="cat-budget" className="text-xs font-medium block mb-1.5" style={{ color: '#9896b0' }}>Límite mensual (opcional)</label>
                  <input id="cat-budget" type="number" value={form.budgetLimit} onChange={e => setForm(f => ({ ...f, budgetLimit: e.target.value }))}
                    placeholder="Sin límite"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', fontFamily: 'inherit' }} />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={resetForm}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-medium"
                    style={{ background: '#18181f', border: '1px solid #2a2a38', color: '#9896b0', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button type="submit"
                    className="flex-1 py-3.5 rounded-2xl text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg, #7c6af7, #ec4899)', border: 'none', color: 'white', cursor: 'pointer' }}>
                    {editingId ? 'Guardar' : 'Crear'}
                  </button>
                </div>
              </form>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 z-[100] px-5 py-3 rounded-2xl text-sm font-medium"
            style={{ transform: 'translateX(-50%)', background: '#18181f', border: '1px solid #2a2a38', color: '#f1f0ff', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
