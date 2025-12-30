import { OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from 'generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    })

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
