jest.mock('react-native-background-fetch', () => ({
  __esModule: true,
  default: {
    NETWORK_TYPE_ANY: 1,
    configure: jest.fn(),
    finish: jest.fn(),
    registerHeadlessTask: jest.fn(),
    stop: jest.fn(),
  },
}));

import { runBackgroundAlertTask } from '../backgroundAlerts';

describe('runBackgroundAlertTask', () => {
  it('finishes successful background work', async () => {
    const check = jest.fn().mockResolvedValue(undefined);
    const finish = jest.fn();

    await runBackgroundAlertTask('task-1', check, finish);

    expect(check).toHaveBeenCalledTimes(1);
    expect(finish).toHaveBeenCalledWith('task-1');
  });

  it('always finishes when an alert check fails', async () => {
    const check = jest
      .fn()
      .mockRejectedValue(new Error('provider unavailable'));
    const finish = jest.fn();

    await expect(
      runBackgroundAlertTask('task-2', check, finish),
    ).rejects.toThrow('provider unavailable');
    expect(finish).toHaveBeenCalledTimes(1);
    expect(finish).toHaveBeenCalledWith('task-2');
  });
});
