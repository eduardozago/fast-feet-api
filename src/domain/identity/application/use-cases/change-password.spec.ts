import { InMemoryAccountsRepository } from 'test/repositories/identity/in-memory-accounts-repository'
import { makeAccount } from 'test/factories/identity/make-account'
import { FakeHashChecker } from 'test/cryptography/fake-hash-checker'
import { FakeHashGenerator } from 'test/cryptography/fake-hasher-generator'
import { ChangePasswordUseCase } from './change-password'
import { InvalidCredentialsError } from './errors/invalid-credentials-error'

let accountsRepository: InMemoryAccountsRepository
let hashChecker: FakeHashChecker
let hashGenerator: FakeHashGenerator
let sut: ChangePasswordUseCase

describe('Change Password', () => {
  beforeEach(() => {
    accountsRepository = new InMemoryAccountsRepository()
    hashChecker = new FakeHashChecker()
    hashGenerator = new FakeHashGenerator()
    sut = new ChangePasswordUseCase(
      accountsRepository,
      hashChecker,
      hashGenerator,
    )
  })

  it('should be able to change account password', async () => {
    const account = makeAccount({
      email: 'john@example.com',
      password: await hashGenerator.hash('123456'),
    })

    accountsRepository.items.push(account)

    const result = await sut.execute({
      email: 'john@example.com',
      password: '123456',
      newPassword: 'new-password',
    })

    expect(result.isRight()).toBe(true)
    expect(accountsRepository.items[0]).toEqual(
      expect.objectContaining({
        email: 'john@example.com',
        password: 'new-password-hashed',
      }),
    )
  })

  it('should not be able to change password with wrong password', async () => {
    const account = makeAccount({
      email: 'john@example.com',
      password: await hashGenerator.hash('123456'),
    })

    accountsRepository.items.push(account)

    const result = await sut.execute({
      email: 'john@example.com',
      password: 'wrong-password',
      newPassword: 'new-password',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidCredentialsError)
  })
})
