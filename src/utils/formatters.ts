import type {CurrencyCode} from '../types';

const CURRENCY_LOCALES: Readonly<Record<CurrencyCode, string>> = {
  CAD: 'en-CA',
  USD: 'en-US',
  EUR: 'en-IE',
  GBP: 'en-GB',
};

export interface CurrencyFormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  compact?: boolean;
}

function validNumber(value: number): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

function fractionDigitsForCurrency(value: number): {
  minimumFractionDigits: number;
  maximumFractionDigits: number;
} {
  const absolute = Math.abs(value);
  if (absolute > 0 && absolute < 0.01) {
    return {minimumFractionDigits: 2, maximumFractionDigits: 8};
  }
  if (absolute > 0 && absolute < 1) {
    return {minimumFractionDigits: 2, maximumFractionDigits: 6};
  }
  return {minimumFractionDigits: 2, maximumFractionDigits: 2};
}

export function formatCurrency(
  value: number,
  currency: CurrencyCode = 'CAD',
  options: CurrencyFormatOptions = {},
): string {
  if (!validNumber(value)) {
    return '—';
  }
  const fractionDigits = fractionDigitsForCurrency(value);
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    notation: options.compact ? 'compact' : 'standard',
    minimumFractionDigits:
      options.minimumFractionDigits ??
      (options.compact ? 0 : fractionDigits.minimumFractionDigits),
    maximumFractionDigits:
      options.maximumFractionDigits ??
      (options.compact ? 1 : fractionDigits.maximumFractionDigits),
  }).format(value);
}

export function formatPercentage(
  value: number,
  includeSign = true,
  fractionDigits = 2,
): string {
  if (!validNumber(value)) {
    return '—';
  }
  const normalized = Object.is(value, -0) ? 0 : value;
  const formatted = new Intl.NumberFormat('en-CA', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Math.abs(normalized));
  const sign = normalized < 0 ? '-' : includeSign && normalized > 0 ? '+' : '';
  return `${sign}${formatted}%`;
}

export function formatCompactNumber(
  value: number,
  maximumFractionDigits = 1,
): string {
  if (!validNumber(value)) {
    return '—';
  }
  return new Intl.NumberFormat('en-CA', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits,
  }).format(value);
}

export function formatMarketCap(
  value: number,
  currency: CurrencyCode = 'CAD',
): string {
  return formatCurrency(value, currency, {compact: true});
}

export function formatDateTime(
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options,
  }).format(date);
}

export function formatRelativeTime(
  value: string | number | Date,
  now: string | number | Date = Date.now(),
): string {
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  const nowTimestamp = now instanceof Date ? now.getTime() : new Date(now).getTime();
  if (!Number.isFinite(timestamp) || !Number.isFinite(nowTimestamp)) {
    return 'an unknown time';
  }
  const elapsedSeconds = Math.round((timestamp - nowTimestamp) / 1000);
  const absoluteSeconds = Math.abs(elapsedSeconds);
  if (absoluteSeconds < 45) {
    return elapsedSeconds > 0 ? 'in a few seconds' : 'just now';
  }

  const units: ReadonlyArray<{
    seconds: number;
    label: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
  }> = [
    {seconds: 365 * 24 * 60 * 60, label: 'year'},
    {seconds: 30 * 24 * 60 * 60, label: 'month'},
    {seconds: 7 * 24 * 60 * 60, label: 'week'},
    {seconds: 24 * 60 * 60, label: 'day'},
    {seconds: 60 * 60, label: 'hour'},
    {seconds: 60, label: 'minute'},
  ];
  const unit = units.find(candidate => absoluteSeconds >= candidate.seconds) ?? units[units.length - 1];
  if (!unit) {
    return 'just now';
  }
  const amount = Math.round(elapsedSeconds / unit.seconds);
  const absoluteAmount = Math.abs(amount);
  const label = `${unit.label}${absoluteAmount === 1 ? '' : 's'}`;
  return amount > 0 ? `in ${absoluteAmount} ${label}` : `${absoluteAmount} ${label} ago`;
}

export function formatPrice(value: number, currency: CurrencyCode = 'CAD'): string {
  return formatCurrency(value, currency);
}

export function formatSupply(value: number, symbol?: string): string {
  const formatted = formatCompactNumber(value, 2);
  return symbol ? `${formatted} ${symbol.toUpperCase()}` : formatted;
}
