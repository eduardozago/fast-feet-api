import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { DeliveriesRepository } from '../../repositories/deliveries-repository'
import {
  Delivery,
  DeliveryStatus,
} from '@/domain/delivery/enterprise/entities/delivery'
import { CouriersRepository } from '../../repositories/couriers-repository'
import { CourierNotFoundError } from './errors/courier-not-found-error'

interface FetchCourierDeliveriesUseCaseRequest {
  accountId: string
  status?: DeliveryStatus
  page: number
  limit: number
}

export type FetchCourierDeliveriesUseCaseResponse = Either<
  CourierNotFoundError,
  {
    deliveries: Delivery[]
  }
>

@Injectable()
export class FetchCourierDeliveriesUseCase {
  constructor(
    private deliveriesRepository: DeliveriesRepository,
    private courierRepository: CouriersRepository,
  ) {}

  async execute({
    accountId,
    status,
    page,
    limit,
  }: FetchCourierDeliveriesUseCaseRequest): Promise<FetchCourierDeliveriesUseCaseResponse> {
    const courier = await this.courierRepository.findByAccountId(accountId)

    if (!courier) {
      return left(new CourierNotFoundError())
    }

    const deliveries = await this.deliveriesRepository.findManyByCourierId(
      courier.id.toString(),
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
