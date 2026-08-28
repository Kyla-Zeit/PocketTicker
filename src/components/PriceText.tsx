import React from 'react';
import type {TextStyle} from 'react-native';
import {AppText} from './AppText';
import {formatCurrency} from '../utils/formatters';
import type {CurrencyCode} from '../types';

type Props = {value: number; currency: CurrencyCode; hidden?: boolean; style?: TextStyle; variant?: 'display' | 'title' | 'heading' | 'bodyStrong'};

export function PriceText({value, currency, hidden, style, variant = 'bodyStrong'}: Props) {
  return <AppText variant={variant} numeric style={style}>{hidden ? '••••••' : formatCurrency(value, currency)}</AppText>;
}
