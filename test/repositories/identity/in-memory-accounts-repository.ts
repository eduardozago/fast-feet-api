import { AccountsRepository } from '@/domain/identity/application/repositories/accounts-repository'
import { Account } from '@/domain/identity/enterprise/entities/account'

export class InMemoryAccountsRepository implements AccountsRepository {
  public items: Account[] = []

  findById(id: string): Promise<Account | null> {
    const account = this.items.find((item) => item.id.toString() === id)

    if (!account) {
      return Promise.resolve(null)
    }

    return Promise.resolve(account)
  }

  findByEmail(email: string): Promise<Account | null> {
    const account = this.items.find((item) => item.email === email)

    if (!account) {
      return Promise.resolve(null)
    }

    return Promise.resolve(account)
  }

  create(account: Account): Promise<void> {
    this.items.push(account)

    return Promise.resolve()
  }

  update(account: Account): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id === account.id)

    this.items[itemIndex] = account

    return Promise.resolve()
  }
}
