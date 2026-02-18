import { AccountsRepository } from '../repositories/accounts-repository'
import { Either, left, right } from '@/core/either'
import { HashChecker } from '../cryptography/hash-checker'
import { InvalidCredentialsError } from './errors/invalid-credentials-error'
import { HashGenerator } from '../cryptography/hash-generator'
import { Account } from '../../enterprise/entities/account'
import { Injectable } from '@nestjs/common'

interface ChangePasswordUseCaseRequest {
  email: string
  password: string
  newPassword: string
}

export type ChangePasswordUseCaseResponse = Either<
  InvalidCredentialsError,
  {
    account: Account
  }
>

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private accountsRepository: AccountsRepository,
    private hashChecker: HashChecker,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    email,
    password,
    newPassword,
  }: ChangePasswordUseCaseRequest): Promise<ChangePasswordUseCaseResponse> {
    const account = await this.accountsRepository.findByEmail(email)

    if (!account) {
      return left(new InvalidCredentialsError())
    }

    const isPasswordValid = await this.hashChecker.check(
      password,
      account.password,
    )

    if (!isPasswordValid) {
      return left(new InvalidCredentialsError())
    }

    const newPasswordHash = await this.hashGenerator.hash(newPassword)

    account.password = newPasswordHash

    await this.accountsRepository.update(account)

    return right({
      account,
    })
  }
}
