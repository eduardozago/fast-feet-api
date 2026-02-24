import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Courier } from '@/domain/delivery/enterprise/entities/courier'
import { CouriersRepository } from '../../repositories/couriers-repository'
import { IdentityGateway } from '../../gateways/identity-gateway'
import { AccountNotFoundError } from './errors/account-not-found-error'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

interface RegisterCourierUseCaseRequest {
  accountId: string
  name: string
}

export type RegisterCourierUseCaseResponse = Either<
  AccountNotFoundError,
  {
    courier: Courier
  }
>

@Injectable()
export class RegisterCourierUseCase {
  constructor(
    private couriersRepository: CouriersRepository,
    private identityGateway: IdentityGateway,
  ) {}

  async execute({
    accountId,
    name,
  }: RegisterCourierUseCaseRequest): Promise<RegisterCourierUseCaseResponse> {
    const account = await this.identityGateway.findWorkerById(accountId)

    if (!account) {
      return left(new AccountNotFoundError())
    }

    const courier = Courier.create({
      accountId: new UniqueEntityID(account.id),
      name,
    })

    await this.couriersRepository.create(courier)

    return right({
      courier,
    })
  }
}
