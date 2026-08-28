export type AnalyticsEvent =
  | {
      name: 'asset_viewed';
      properties: { assetId: string };
    }
  | {
      name: 'watchlist_added';
      properties: { assetId: string };
    }
  | {
      name: 'watchlist_removed';
      properties: { assetId: string };
    }
  | {
      name: 'alert_created';
      properties: { assetId: string; condition: 'above' | 'below' };
    }
  | {
      name: 'alert_triggered';
      properties: { assetId: string; alertId: string };
    }
  | {
      name: 'portfolio_holding_added';
      properties: { assetId: string };
    }
  | {
      name: 'preference_changed';
      properties: { preference: string };
    };

export interface Analytics {
  track(event: AnalyticsEvent): void;
}

export interface AnalyticsLogger {
  log(message: string, payload: Readonly<Record<string, unknown>>): void;
}

const consoleLogger: AnalyticsLogger = {
  log(message, payload) {
    // Development-only instrumentation. Event properties deliberately exclude
    // balances, quantities, alert targets, and other potentially sensitive values.
    console.log(message, payload);
  },
};

export class ConsoleAnalytics implements Analytics {
  public constructor(
    private readonly enabled = typeof __DEV__ === 'boolean' ? __DEV__ : false,
    private readonly logger: AnalyticsLogger = consoleLogger,
  ) {}

  public track(event: AnalyticsEvent): void {
    if (!this.enabled) {
      return;
    }

    this.logger.log(`[analytics] ${event.name}`, { ...event.properties });
  }
}

export class NoopAnalytics implements Analytics {
  public track(_event: AnalyticsEvent): void {}
}

export const analytics: Analytics = new ConsoleAnalytics();
