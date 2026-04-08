import { InMemoryAccountsRepository } from 'test/repositories/identity/in-memory-accounts-repository'
import { makeAccount } from 'test/factories/identity/make-account'
import { IdentityGateway } from './identity-gateway'

let accountsRepository: InMemoryAccountsRepository
let gateway: IdentityGateway

describe('Identity Gateway', () => {
  beforeEach(() => {
    accountsRepository = new InMemoryAccountsRepository()
    gateway = new IdentityGateway(accountsRepository)
  })

  it('should be able to find an account by id', async () => {
    const account = makeAccount()

    accountsRepository.items.push(account)

    const result = await gateway.getAccount(account.id.toString())

    expect(result).toEqual(
      expect.objectContaining({
        id: account.id.toString(),
        role: account.role,
      }),
    )
  })

  it('should return null when account is not found', async () => {
    const result = await gateway.getAccount('invalid-account-id')

    expect(result).toBeNull()
  })
})
