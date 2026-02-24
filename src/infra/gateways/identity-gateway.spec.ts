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

  it('should be able to find a worker by id', async () => {
    const account = makeAccount({
      email: 'john@example.com',
      role: 'WORKER',
    })

    accountsRepository.items.push(account)

    const result = await gateway.findWorkerById(account.id.toString())

    expect(result).toEqual(
      expect.objectContaining({
        id: account.id.toString(),
      }),
    )
  })

  it('should not be able to find a worker with a different role', async () => {
    const account = makeAccount({
      email: 'john@example.com',
      role: 'ADMIN',
    })

    accountsRepository.items.push(account)

    const result = await gateway.findWorkerById(account.id.toString())

    expect(result).toBeNull()
  })
})
