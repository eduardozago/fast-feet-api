import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Account,
  AccountProps,
  AccountRole,
} from '@/domain/identity/enterprise/entities/account'
import { faker } from '@faker-js/faker'

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
