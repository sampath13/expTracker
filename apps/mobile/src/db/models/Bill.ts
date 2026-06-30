import { Model, Query } from '@nozbe/watermelondb';
import { field, date, children } from '@nozbe/watermelondb/decorators';
import type BillItem from './BillItem';

export default class Bill extends Model {
  static table = 'bills';

  @field('user_id') userId!: string;
  @field('retailer_name') retailerName!: string;
  @field('outlet_name') outletName!: string | null;
  @field('total') total!: number;
  @date('confirmed_at') confirmedAt!: Date;
  @field('sync_state') syncState!: string;
  @children('bill_items') items!: Query<BillItem>;
}
