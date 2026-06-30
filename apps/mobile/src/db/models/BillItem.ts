import { Model, Relation } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import type Bill from './Bill';

export default class BillItem extends Model {
  static table = 'bill_items';

  static associations = {
    bills: { type: 'belongs_to' as const, key: 'bill_id' },
  };

  @field('bill_id') billId!: string;
  @field('raw_text') rawText!: string;
  @field('matched_name') matchedName!: string | null;
  @field('qty') qty!: number;
  @field('unit') unit!: string | null;
  @field('unit_price') unitPrice!: number;
  @field('total') total!: number;
  @field('confidence') confidence!: string | null;

  @relation('bills', 'bill_id') bill!: Relation<Bill>;
}
