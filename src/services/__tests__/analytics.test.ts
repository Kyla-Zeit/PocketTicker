import { ConsoleAnalytics } from '../analytics';

describe('ConsoleAnalytics', () => {
  it('emits typed, non-sensitive development events when enabled', () => {
    const logger = { log: jest.fn() };
    const analytics = new ConsoleAnalytics(true, logger);

    analytics.track({
      name: 'alert_created',
      properties: { assetId: 'bitcoin', condition: 'above' },
    });

    expect(logger.log).toHaveBeenCalledWith('[analytics] alert_created', {
      assetId: 'bitcoin',
      condition: 'above',
    });
  });

  it('is silent when disabled', () => {
    const logger = { log: jest.fn() };
    const analytics = new ConsoleAnalytics(false, logger);

    analytics.track({
      name: 'asset_viewed',
      properties: { assetId: 'ethereum' },
    });

    expect(logger.log).not.toHaveBeenCalled();
  });
});
