import BackgroundFetch, {
  type BackgroundFetchStatus,
  type HeadlessEvent,
} from 'react-native-background-fetch';

export const BACKGROUND_ALERT_TASK_ID = 'com.pocketticker.price-alert-check';

export type BackgroundAlertCheck = () => Promise<unknown>;

interface BackgroundFetchAdapter {
  readonly NETWORK_TYPE_ANY: typeof BackgroundFetch.NETWORK_TYPE_ANY;
  configure(
    config: Parameters<typeof BackgroundFetch.configure>[0],
    onEvent: (taskId: string) => void,
    onTimeout?: (taskId: string) => void,
  ): Promise<BackgroundFetchStatus>;
  finish(taskId: string): void;
  registerHeadlessTask(task: (event: HeadlessEvent) => Promise<void>): void;
  stop(taskId?: string): Promise<boolean>;
}

export const runBackgroundAlertTask = async (
  taskId: string,
  checkAlerts: BackgroundAlertCheck,
  finish: (completedTaskId: string) => void = BackgroundFetch.finish.bind(
    BackgroundFetch,
  ),
): Promise<void> => {
  try {
    await checkAlerts();
  } finally {
    // Android and iOS both throttle future work when finish is omitted. Keeping this
    // in finally guarantees completion is signalled even after a provider error.
    finish(taskId);
  }
};

export const configureBackgroundAlerts = async (
  checkAlerts: BackgroundAlertCheck,
  native: BackgroundFetchAdapter = BackgroundFetch,
): Promise<BackgroundFetchStatus> => {
  const activeFinishers = new Map<string, () => void>();

  return native.configure(
    {
      minimumFetchInterval: 15,
      requiredNetworkType: native.NETWORK_TYPE_ANY,
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      requiresBatteryNotLow: true,
    },
    taskId => {
      let finished = false;
      const finishOnce = (): void => {
        if (finished) {
          return;
        }
        finished = true;
        activeFinishers.delete(taskId);
        native.finish(taskId);
      };
      activeFinishers.set(taskId, finishOnce);
      runBackgroundAlertTask(taskId, checkAlerts, finishOnce).catch(
        () => undefined,
      );
    },
    taskId => {
      const finish = activeFinishers.get(taskId);
      if (finish) {
        finish();
      } else {
        native.finish(taskId);
      }
    },
  );
};

/**
 * Must be invoked from the React Native entry module so Android can run checks after
 * process termination. Android JobScheduler controls the actual cadence; 15 minutes
 * is a minimum interval, not a guarantee of continuous polling.
 */
export const registerBackgroundAlertHeadlessTask = (
  checkAlerts: BackgroundAlertCheck,
  native: BackgroundFetchAdapter = BackgroundFetch,
): void => {
  native.registerHeadlessTask(async event => {
    if (event.timeout) {
      native.finish(event.taskId);
      return;
    }

    await runBackgroundAlertTask(event.taskId, checkAlerts, id =>
      native.finish(id),
    );
  });
};

export const stopBackgroundAlerts = (
  native: BackgroundFetchAdapter = BackgroundFetch,
): Promise<boolean> => native.stop();
