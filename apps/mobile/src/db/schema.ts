import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'users',
      columns: [
        { name: 'email', type: 'string' },
        { name: 'mobile', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'bills',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'retailer_name', type: 'string' },
        { name: 'outlet_name', type: 'string', isOptional: true },
        { name: 'total', type: 'number' },
        { name: 'confirmed_at', type: 'number' },
        { name: 'sync_state', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'bill_items',
      columns: [
        { name: 'bill_id', type: 'string', isIndexed: true },
        { name: 'raw_text', type: 'string' },
        { name: 'matched_name', type: 'string', isOptional: true },
        { name: 'qty', type: 'number' },
        { name: 'unit', type: 'string', isOptional: true },
        { name: 'unit_price', type: 'number' },
        { name: 'total', type: 'number' },
        { name: 'confidence', type: 'string', isOptional: true },
      ],
    }),
  ],
});
