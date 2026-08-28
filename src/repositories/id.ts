/** Generates collision-resistant-enough identifiers for local, non-security data. */
export const createRepositoryId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
