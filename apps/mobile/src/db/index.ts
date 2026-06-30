import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import Bill from './models/Bill';
import BillItem from './models/BillItem';
import User from './models/User';

const adapter = new SQLiteAdapter({
  schema,
  jsi: true,
  onSetUpError: (error) => {
    console.error('WatermelonDB setup error:', error);
  },
});

const database = new Database({
  adapter,
  modelClasses: [User, Bill, BillItem],
});

export function resetDatabase(): Promise<void> {
  return database.write(async () => {
    await database.unsafeResetDatabase();
  });
}

export { database };
export default database;
