import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Account,
  AccountProps,
  AccountRole,
} from '@/domain/identity/enterprise/entities/account'
import { PrismaAccountMapper } from '@/infra/database/prisma/mappers/identity/prisma-account-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'

export function makeAccount(
  override: Partial<AccountProps> = {},
  id?: UniqueEntityID,
) {
  const account = Account.create(
    {
      email: faker.internet.email(),
      password: faker.internet.password(),
      role: AccountRole.WORKER,
      ...override,
    },
    id,
  )

  return account
}

@Injectable()
export class AccountFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaAccount(data: Partial<AccountProps> = {}): Promise<Account> {
    const account = makeAccount(data)

    await this.prisma.account.create({
      data: PrismaAccountMapper.toPrisma(account),
    })

    return account
  }
}
