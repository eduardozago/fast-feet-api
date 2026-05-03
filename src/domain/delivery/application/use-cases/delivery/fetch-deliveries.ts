import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { DeliveriesRepository } from '../../repositories/deliveries-repository'
import {
  Delivery,
  DeliveryStatus,
} from '@/domain/delivery/enterprise/entities/delivery'

interface FetchDeliveriesUseCaseRequest {
  status?: DeliveryStatus
  page: number
  limit: number
}

export type FetchDeliveriesUseCaseResponse = Either<
  null,
  {
    deliveries: Delivery[]
  }
>

@Injectable()
export class FetchDeliveriesUseCase {
  constructor(private deliveriesRepository: DeliveriesRepository) {}

  async execute({
    status,
    page,
    limit,
  }: FetchDeliveriesUseCaseRequest): Promise<FetchDeliveriesUseCaseResponse> {
    const deliveries = await this.deliveriesRepository.findMany(
      {
        page,
        limit,
      },
      {
        status,
      },
    )

    return right({
      deliveries,
    })
  }
}
