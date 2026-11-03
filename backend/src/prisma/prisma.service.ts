import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Pass pool config (not a Pool instance) so the adapter owns the pool
    // and $disconnect() actually closes it — otherwise tests/CLI hang.
    super({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30_000,
      }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
