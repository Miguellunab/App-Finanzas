// Formatear moneda según el tipo
export function formatCurrency(amount: number, currency: string = 'COP'): string {
  const formatters: Record<string, Intl.NumberFormat> = {
    COP: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }),
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }),
    EUR: new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }),
  };
  const formatter = formatters[currency] ?? formatters['COP'];
  return formatter.format(amount);
}

export function formatNumberInput(value: string | number): string {
  const raw = String(value);
  return `${raw.trim().startsWith('-') ? '-' : ''}${raw.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

export function parseNumberInput(value: string | number): number {
  return Number(String(value).replace(/\./g, '')) || 0;
}

export const WALLET_LOGOS = [
  { key: 'bancolombia', src: '/logos/bancolombia.png' },
  { key: 'littio', src: '/logos/littio.png' },
  { key: 'nequi', src: '/logos/nequi.png' },
  { key: 'rappipay', src: '/logos/rappipay.png' },
];

export function walletLogo(emoji: string, name = ''): string | null {
  if (emoji.startsWith('/logos/')) return emoji;
  const text = `${name} ${emoji}`.toLowerCase();
  return WALLET_LOGOS.find(logo => text.includes(logo.key))?.src ?? null;
}

// Formatear fecha en español
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Obtener inicio y fin del mes actual
export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

// Abreviar montos grandes (ej: 1.200.000 → 1.2M)
export function abbreviateAmount(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toFixed(0);
}

// Colores para categorías (paleta oscura)
export const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6',
];

// Obtener fecha actual en formato YYYY-MM-DD
export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}
