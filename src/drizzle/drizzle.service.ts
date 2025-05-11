import { Injectable, OnModuleInit } from '@nestjs/common';
import { PostgresJsDatabase, drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';  // Default import
import * as schema from './schema';

@Injectable()
export class DrizzleService implements OnModuleInit {
  private db: PostgresJsDatabase<typeof schema>;

  async onModuleInit() {
    const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/nirnai';
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
  }

  getDb(): PostgresJsDatabase<typeof schema> {
    if (!this.db) {
      throw new Error('Database connection not initialized');
    }
    return this.db;
  }
}