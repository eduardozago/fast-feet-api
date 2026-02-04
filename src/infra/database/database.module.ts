import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { AccountsRepository } from '@/domain/identity/application/repositories/accounts-repository'
import { PrismaAccountsRepository } from './prisma/repositories/identity/prisma-accounts-repository'

@Module({
  providers: [
    PrismaService,
    {
      provide: AccountsRepository,
      useClass: PrismaAccountsRepository,
    },
  ],
  exports: [PrismaService, AccountsRepository],
})
export class DatabaseModule {}
