import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { AccountsRepository } from '@/domain/identity/application/repositories/accounts-repository'
import { PrismaAccountsRepository } from './prisma/repositories/identity/prisma-accounts-repository'
import { CouriersRepository } from '@/domain/delivery/application/repositories/couriers-repository'
import { PrismaCouriersRepository } from './prisma/repositories/delivery/prisma-couriers-repository'
import { RecipientAddressesRepository } from '@/domain/delivery/application/repositories/recipient-addresses-repository'
import { PrismaRecipientAddressesRepository } from './prisma/repositories/delivery/prisma-recipient-addresses-repository'
import { RecipientsRepository } from '@/domain/delivery/application/repositories/recipients-repository'
import { PrismaRecipientsRepository } from './prisma/repositories/delivery/prisma-recipients-repository'

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
    {
      provide: RecipientsRepository,
      useClass: PrismaRecipientsRepository,
    },
    {
      provide: RecipientAddressesRepository,
      useClass: PrismaRecipientAddressesRepository,
    },
  ],
  exports: [
    PrismaService,
    AccountsRepository,
    CouriersRepository,
    RecipientsRepository,
    RecipientAddressesRepository,
  ],
})
export class DatabaseModule {}
