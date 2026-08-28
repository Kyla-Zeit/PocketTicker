import type {
  AlertCondition,
  AlertEvaluation,
  PriceAlert,
} from '../types';

export function isAlertConditionMet(
  condition: AlertCondition,
  targetPrice: number,
  currentPrice: number,
): boolean {
  if (!Number.isFinite(targetPrice) || !Number.isFinite(currentPrice)) {
    return false;
  }
  return condition === 'above'
    ? currentPrice >= targetPrice
    : currentPrice <= targetPrice;
}

export function evaluatePriceAlert(
  alert: PriceAlert,
  currentPrice: number,
): AlertEvaluation {
  if (!alert.enabled) {
    return {isTriggered: false, reason: 'disabled'};
  }
  if (alert.triggeredAt) {
    return {isTriggered: false, reason: 'already_triggered'};
  }
  const isTriggered = isAlertConditionMet(
    alert.condition,
    alert.targetPrice,
    currentPrice,
  );
  return {
    isTriggered,
    reason: isTriggered ? 'condition_met' : 'condition_not_met',
  };
}

export function evaluateAlertCondition(
  alert: PriceAlert,
  currentPrice: number,
): boolean {
  return evaluatePriceAlert(alert, currentPrice).isTriggered;
}

export const shouldTriggerPriceAlert = evaluateAlertCondition;

export function markAlertTriggered(
  alert: PriceAlert,
  triggeredAt = new Date().toISOString(),
): PriceAlert {
  return {...alert, enabled: false, triggeredAt};
}
