import type {AlertCondition, Holding, PriceAlert} from '../types';

export type ValidationErrors<Field extends string> = Partial<Record<Field, string>>;

export interface HoldingInput {
  assetId?: string;
  symbol?: string;
  amount: number;
  averagePurchasePrice?: number;
}

export interface AlertInput {
  assetId?: string;
  symbol?: string;
  condition?: AlertCondition;
  targetPrice: number;
}

export function validateHoldingInput(
  input: HoldingInput,
): ValidationErrors<'assetId' | 'amount' | 'averagePurchasePrice'> {
  const errors: ValidationErrors<'assetId' | 'amount' | 'averagePurchasePrice'> = {};
  if (!input.assetId?.trim()) {
    errors.assetId = 'Select an asset.';
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    errors.amount = 'Enter an amount greater than zero.';
  }
  if (
    input.averagePurchasePrice !== undefined &&
    (!Number.isFinite(input.averagePurchasePrice) || input.averagePurchasePrice <= 0)
  ) {
    errors.averagePurchasePrice = 'Purchase price must be greater than zero.';
  }
  return errors;
}

export function validateAlertInput(
  input: AlertInput,
): ValidationErrors<'assetId' | 'condition' | 'targetPrice'> {
  const errors: ValidationErrors<'assetId' | 'condition' | 'targetPrice'> = {};
  if (!input.assetId?.trim()) {
    errors.assetId = 'Select an asset.';
  }
  if (input.condition !== 'above' && input.condition !== 'below') {
    errors.condition = 'Choose above or below.';
  }
  if (!Number.isFinite(input.targetPrice) || input.targetPrice <= 0) {
    errors.targetPrice = 'Enter a target price greater than zero.';
  }
  return errors;
}

export function isHoldingValid(input: HoldingInput | Holding): boolean {
  return Object.keys(validateHoldingInput(input)).length === 0;
}

export function isPriceAlertValid(input: AlertInput | PriceAlert): boolean {
  return Object.keys(validateAlertInput(input)).length === 0;
}
