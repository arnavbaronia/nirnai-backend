import { Injectable } from '@nestjs/common';
import { PostgresJsDatabase, drizzle } from 'drizzle-orm/postgres-js';
import * as postgres from 'postgres';
import * as schema from './schema';

@Injectable()
export class DrizzleService {
  private db: PostgresJsDatabase<typeof schema>;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
  }

  getDb(): PostgresJsDatabase<typeof schema> {
    return this.db;
  }
}