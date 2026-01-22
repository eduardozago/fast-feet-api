import {
  Account,
  AccountRole,
} from '@/domain/identity/enterprise/entities/account'
import { AccountsRepository } from '../repositories/accounts-repository'
import { Either, left, right } from '@/core/either'
import { HashGenerator } from '../cryptography/hash-generator'
import { AccountAlreadyExistsError } from './errors/account-already-exists-error'

interface CreateAccountUseCaseRequest {
  email: string
  password: string
  role: AccountRole
}

export type CreateAccountUseCaseResponse = Either<
  AccountAlreadyExistsError,
  {
    account: Account
  }
>

export class CreateAccountUseCase {
  constructor(
    private accountsRepository: AccountsRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    email,
    password,
    role,
  }: CreateAccountUseCaseRequest): Promise<CreateAccountUseCaseResponse> {
    const accountAlreadyExists =
      await this.accountsRepository.findByEmail(email)

    if (accountAlreadyExists) {
      return left(new AccountAlreadyExistsError())
    }

    const passwordHash = await this.hashGenerator.hash(password)

    const account = Account.create({
      email,
      password: passwordHash,
      role,
    })

    await this.accountsRepository.create(account)

    return right({
      account,
    })
  }
}
