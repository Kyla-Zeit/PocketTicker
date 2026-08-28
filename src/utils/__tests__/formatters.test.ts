import {
  formatCompactNumber,
  formatCurrency,
  formatDateTime,
  formatPercentage,
  formatRelativeTime,
} from '../formatters';

describe('formatters', () => {
  it('formats each supported currency with its familiar symbol', () => {
    expect(formatCurrency(1_234.56, 'CAD')).toBe('$1,234.56');
    expect(formatCurrency(1_234.56, 'USD')).toBe('$1,234.56');
    expect(formatCurrency(1_234.56, 'EUR')).toBe('€1,234.56');
    expect(formatCurrency(1_234.56, 'GBP')).toBe('£1,234.56');
  });

  it('preserves useful precision for low-priced assets', () => {
    expect(formatCurrency(0.00001234, 'USD')).toBe('$0.00001234');
  });

  it('formats signed and unsigned percentages', () => {
    expect(formatPercentage(2.345)).toBe('+2.35%');
    expect(formatPercentage(-2.345)).toBe('-2.35%');
    expect(formatPercentage(2.345, false)).toBe('2.35%');
    expect(formatPercentage(0)).toBe('0.00%');
  });

  it('formats compact market values and rejects invalid input safely', () => {
    expect(formatCompactNumber(1_234_000_000)).toBe('1.2B');
    expect(formatCurrency(Number.NaN)).toBe('—');
    expect(formatDateTime('not-a-date')).toBe('—');
  });

  it('describes stale timestamps relative to a stable reference', () => {
    const now = Date.parse('2026-08-25T20:30:00.000Z');
    expect(formatRelativeTime(now - 14 * 60_000, now)).toBe('14 minutes ago');
    expect(formatRelativeTime(now + 2 * 60 * 60_000, now)).toBe('in 2 hours');
  });
});
