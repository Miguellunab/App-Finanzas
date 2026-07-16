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

export function creditInstallment({
  amount,
  installments,
  installmentNumber,
  interestRate,
  interestPeriod,
  interestApplied,
  interestFromFirstInstallment,
}: {
  amount: number;
  installments: number;
  installmentNumber: number;
  interestRate: number;
  interestPeriod: string;
  interestApplied: boolean;
  interestFromFirstInstallment: boolean;
}) {
  const count = Math.max(1, Math.trunc(installments));
  const number = Math.trunc(installmentNumber);
  if (number < 1 || number > count || amount <= 0) return { principal: 0, interest: 0, total: 0 };

  const principal = amount / count;
  const pendingPrincipal = amount - principal * (number - 1);
  const monthlyRate = interestPeriod === 'MV'
    ? interestRate / 100
    : Math.pow(1 + interestRate / 100, 1 / 12) - 1;
  const interest = interestApplied && (interestFromFirstInstallment || number > 1)
    ? pendingPrincipal * monthlyRate
    : 0;

  return { principal, interest, total: principal + interest };
}

export function installmentNumberForMonth(purchaseDate: string, currentDate: string) {
  const [purchaseYear, purchaseMonth] = purchaseDate.split('-').map(Number);
  const [currentYear, currentMonth] = currentDate.split('-').map(Number);
  return (currentYear - purchaseYear) * 12 + currentMonth - purchaseMonth + 1;
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

// Obtener el ciclo financiero actual: del día 20 al 19 del mes siguiente
export function getCurrentMonthRange(currentDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())): { start: string; end: string } {
  const [year, month, day] = currentDate.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - (day >= 20 ? 1 : 2), 20));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 19));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
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
