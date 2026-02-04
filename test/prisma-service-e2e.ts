import { OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from 'generated/prisma/client'
import { createTestAdapter } from './setup-e2e'

export class PrismaServiceE2E
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = createTestAdapter()

    super({
      adapter,
      log: ['warn', 'error'],
    })
  }

  onModuleInit() {
    return this.$connect()
  }

  onModuleDestroy() {
    return this.$disconnect()
  }
}
