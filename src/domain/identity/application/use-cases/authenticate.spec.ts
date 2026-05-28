import { InMemoryAccountsRepository } from 'test/repositories/identity/in-memory-accounts-repository'
import { makeAccount } from 'test/factories/identity/make-account'
import { FakeHashChecker } from 'test/cryptography/fake-hash-checker'
import { Encrypter } from '../cryptography/encrypter'
import { AuthenticateUseCase } from './authenticate'
import { FakeEncrypter } from 'test/cryptography/fake-encrypter'
import { FakeHashGenerator } from 'test/cryptography/fake-hasher-generator'
import { InvalidCredentialsError } from './errors/invalid-credentials-error'

let accountsRepository: InMemoryAccountsRepository
let hashChecker: FakeHashChecker
let encrypter: Encrypter
let hashGenerator: FakeHashGenerator
let sut: AuthenticateUseCase

describe('Authenticate', () => {
  beforeEach(() => {
    accountsRepository = new InMemoryAccountsRepository()
    hashChecker = new FakeHashChecker()
    encrypter = new FakeEncrypter()
    hashGenerator = new FakeHashGenerator()
    sut = new AuthenticateUseCase(accountsRepository, hashChecker, encrypter)
  })

  it('should be able to authenticate an account', async () => {
    const account = makeAccount({
      email: 'john@example.com',
      password: await hashGenerator.hash('123456'),
    })

    accountsRepository.items.push(account)

    const result = await sut.execute({
      email: 'john@example.com',
      password: '123456',
    })

    const accessTokenEncrypted = await encrypter.encrypt({
      sub: account.id.toString(),
      role: account.role,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      accessToken: accessTokenEncrypted,
    })
  })

  it('should not be able to authenticate an account with invalid credentials', async () => {
    const account = makeAccount({
      email: 'john@example.com',
      password: await hashGenerator.hash('123456'),
    })

    accountsRepository.items.push(account)

    const result = await sut.execute({
      email: 'john@example.com',
      password: 'wrong-password',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidCredentialsError)
  })
})
