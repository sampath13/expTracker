import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class User extends Model {
  static table = 'users';

  @field('email') email!: string;
  @field('mobile') mobile!: string | null;
  @date('created_at') createdAt!: Date;
}
