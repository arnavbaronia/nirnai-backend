import { Module } from '@nestjs/common';
import { DrizzleService } from './drizzle.service';
import * as schema from './schema';

@Module({
  providers: [DrizzleService],
  exports: [DrizzleService],
})
export class DrizzleModule {}