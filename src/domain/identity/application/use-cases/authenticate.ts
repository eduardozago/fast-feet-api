import { AccountsRepository } from '../repositories/accounts-repository'
import { Either, left, right } from '@/core/either'
import { HashChecker } from '../cryptography/hash-checker'
import { InvalidCredentialsError } from './errors/invalid-credentials-error'
import { Encrypter } from '../cryptography/encrypter'
import { Injectable } from '@nestjs/common'

interface AuthenticateUseCaseRequest {
  email: string
  password: string
}

export type AuthenticateUseCaseResponse = Either<
  InvalidCredentialsError,
  {
    accessToken: string
  }
>

@Injectable()
export class AuthenticateUseCase {
  constructor(
    private accountsRepository: AccountsRepository,
    private hashChecker: HashChecker,
    private encrypter: Encrypter,
  ) {}

  async execute({
    email,
    password,
  }: AuthenticateUseCaseRequest): Promise<AuthenticateUseCaseResponse> {
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

    const accessToken = await this.encrypter.encrypt({
      sub: account.id.toString(),
    })

    return right({
      accessToken,
    })
  }
}
