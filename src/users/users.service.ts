import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersService {
  constructor(private drizzleService: DrizzleService) {}

  private get db() {
    return this.drizzleService.getDb();
  }

  async findOne(username: string): Promise<any | undefined> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);
    return user;
  }

  async create(username: string, password: string): Promise<any> {
    const [user] = await this.db
      .insert(schema.users)
      .values({ username, password })
      .returning();
    return user;
  }
}