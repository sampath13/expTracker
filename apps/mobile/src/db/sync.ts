import { synchronize } from '@nozbe/watermelondb/sync';

export async function syncDatabase(): Promise<void> {
  // Stub — implemented in S4.5
  // await synchronize({
  //   database,
  //   pullChanges: async ({ lastPulledAt }) => ({ changes: {}, timestamp: Date.now() }),
  //   pushChanges: async ({ changes, lastPulledAt }) => {},
  // });
}
