import { InMemoryAccountsRepository } from 'test/repositories/identity/in-memory-accounts-repository'
import { CreateAccountUseCase } from './create-account'
import { AccountRole } from '@/domain/identity/enterprise/entities/account'
import { FakeHashGenerator } from 'test/cryptography/fake-hasher-generator'
import { makeAccount } from 'test/factories/identity/make-account'
import { AccountAlreadyExistsError } from './errors/account-already-exists-error'

let accountsRepository: InMemoryAccountsRepository
let hashGenerator: FakeHashGenerator
let sut: CreateAccountUseCase

describe('Create Account', () => {
  beforeEach(() => {
    accountsRepository = new InMemoryAccountsRepository()
    hashGenerator = new FakeHashGenerator()
    sut = new CreateAccountUseCase(accountsRepository, hashGenerator)
  })

  it('should be able to create an account', async () => {
    const result = await sut.execute({
      email: 'john@example.com',
      password: '123456',
      role: AccountRole.ADMIN,
    })

    expect(result.isRight()).toBe(true)
    expect(accountsRepository.items).toHaveLength(1)
    expect(accountsRepository.items[0]).toEqual(
      expect.objectContaining({
        email: 'john@example.com',
      }),
    )
  })

  it('should not be able to create an account with same email', async () => {
    const account = makeAccount({
      email: 'john@example.com',
    })

    accountsRepository.items.push(account)

    const result = await sut.execute({
      email: 'john@example.com',
      password: '123456',
      role: AccountRole.ADMIN,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(AccountAlreadyExistsError)
  })

  it('should not be able to hash password', async () => {
    const result = await sut.execute({
      email: 'john@example.com',
      password: '123456',
      role: AccountRole.ADMIN,
    })

    expect(result.isRight()).toBe(true)
    expect(accountsRepository.items[0]).toEqual(
      expect.objectContaining({
        email: 'john@example.com',
        password: '123456-hashed',
      }),
    )
  })
})
