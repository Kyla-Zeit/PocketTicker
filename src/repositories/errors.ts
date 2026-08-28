const describeUnknownError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === 'string' ? error : 'Unknown storage error';
};

export class RepositoryHydrationError extends Error {
  readonly storageKey: string;

  constructor(storageKey: string, message: string) {
    super(`Could not fully restore ${storageKey}: ${message}`);
    this.name = 'RepositoryHydrationError';
    this.storageKey = storageKey;
  }
}

export class RepositoryStorageError extends Error {
  readonly storageKey: string;
  readonly operation: 'read' | 'write';
  readonly originalError: unknown;

  constructor(
    storageKey: string,
    operation: 'read' | 'write',
    originalError: unknown,
  ) {
    super(
      `Could not ${operation} ${storageKey}: ${describeUnknownError(
        originalError,
      )}`,
    );
    this.name = 'RepositoryStorageError';
    this.storageKey = storageKey;
    this.operation = operation;
    this.originalError = originalError;
  }
}
