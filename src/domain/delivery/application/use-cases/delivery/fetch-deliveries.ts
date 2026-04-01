import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { DeliveriesRepository } from '../../repositories/deliveries-repository'
import { Delivery } from '@/domain/delivery/enterprise/entities/delivery'
import { AccountNotFoundError } from '../courier/errors/account-not-found-error'

interface FetchDeliveriesUseCaseRequest {
  page: number
  limit: number
}

export type FetchDeliveriesUseCaseResponse = Either<
  AccountNotFoundError,
  {
    deliveries: Delivery[]
  }
>

@Injectable()
export class FetchDeliveriesUseCase {
  constructor(private deliveriesRepository: DeliveriesRepository) {}

  async execute({
    page,
    limit,
  }: FetchDeliveriesUseCaseRequest): Promise<FetchDeliveriesUseCaseResponse> {
    const deliveries = await this.deliveriesRepository.findMany({
      page,
      limit,
    })

    return right({
      deliveries,
    })
  }
}
