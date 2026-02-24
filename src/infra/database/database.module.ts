import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { AccountsRepository } from '@/domain/identity/application/repositories/accounts-repository'
import { PrismaAccountsRepository } from './prisma/repositories/identity/prisma-accounts-repository'
import { CouriersRepository } from '@/domain/delivery/application/repositories/couriers-repository'
import { PrismaCouriersRepository } from './prisma/repositories/delivery/prisma-couriers-repository'

@Module({
  providers: [
    PrismaService,
    {
      provide: AccountsRepository,
      useClass: PrismaAccountsRepository,
    },
    {
      provide: CouriersRepository,
      useClass: PrismaCouriersRepository,
    },
  ],
  exports: [PrismaService, AccountsRepository, CouriersRepository],
})
export class DatabaseModule {}
