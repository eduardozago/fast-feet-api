import { InMemoryAccountsRepository } from 'test/repositories/identity/in-memory-accounts-repository'
import { makeAccount } from 'test/factories/identity/make-account'
import { InMemoryCouriersRepository } from 'test/repositories/delivery/in-memory-couriers-repository'
import { RegisterCourierUseCase } from './register-courier'
import { IdentityGateway } from '@/domain/delivery/application/gateways/identity-gateway'
import { FakeIdentityGateway } from 'test/gateways/fake-identity-gateway'
import { AccountNotFoundError } from './errors/account-not-found-error'

let couriersRepository: InMemoryCouriersRepository
let accountsRepository: InMemoryAccountsRepository
let identityGateway: IdentityGateway
let sut: RegisterCourierUseCase

describe('Create Account', () => {
  beforeEach(() => {
    couriersRepository = new InMemoryCouriersRepository()
    accountsRepository = new InMemoryAccountsRepository()
    identityGateway = new FakeIdentityGateway(accountsRepository)
    sut = new RegisterCourierUseCase(couriersRepository, identityGateway)
  })

  it('should be able to register a courier', async () => {
    const account = makeAccount({
      email: 'john@example.com',
      role: 'WORKER',
    })

    accountsRepository.items.push(account)

    const result = await sut.execute({
      accountId: account.id.toString(),
      name: 'John Doe',
    })

    expect(result.isRight()).toBe(true)
    expect(couriersRepository.items).toHaveLength(1)
    expect(couriersRepository.items[0]).toEqual(
      expect.objectContaining({
        accountId: account.id,
      }),
    )
  })

  it('should not be able to register a courier with invalid account', async () => {
    const result = await sut.execute({
      accountId: 'invalid-account-id',
      name: 'John Doe',
    })

    expect(result.isLeft()).toBe(true)
    expect(couriersRepository.items).toHaveLength(0)
    expect(result.value).toBeInstanceOf(AccountNotFoundError)
  })
})
