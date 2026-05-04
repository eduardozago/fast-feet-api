import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { DeliveriesRepository } from '../../repositories/deliveries-repository'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'
import { CouriersRepository } from '../../repositories/couriers-repository'
import { CourierNotFoundError } from './errors/courier-not-found-error'
import { Coordinate } from '@/domain/delivery/enterprise/entities/value-objects/coordinate'
import { CourierDeliveryDetails } from '../../repositories/read-models/courier-delivery-details'

interface FetchNearbyCourierDeliveriesUseCaseRequest {
  accountId: string
  latitude: number
  longitude: number
  radiusInKm: number
  page: number
  limit: number
}

export type FetchNearbyCourierDeliveriesUseCaseResponse = Either<
  CourierNotFoundError,
  {
    deliveries: CourierDeliveryDetails[]
  }
>

@Injectable()
export class FetchNearbyCourierDeliveriesUseCase {
  constructor(
    private deliveriesRepository: DeliveriesRepository,
    private couriersRepository: CouriersRepository,
  ) {}

  async execute({
    accountId,
    latitude,
    longitude,
    radiusInKm,
    page,
    limit,
  }: FetchNearbyCourierDeliveriesUseCaseRequest): Promise<FetchNearbyCourierDeliveriesUseCaseResponse> {
    const courier = await this.couriersRepository.findByAccountId(accountId)

    if (!courier) {
      return left(new CourierNotFoundError())
    }

    const courierCoordinate = Coordinate.create({
      latitude,
      longitude,
    })

    const deliveries = await this.deliveriesRepository.findNearbyByCourierId(
      courier.id.toString(),
      courierCoordinate,
      radiusInKm,
      {
        page,
        limit,
      },
      {
        status: DeliveryStatus.IN_TRANSIT,
      },
    )

    return right({
      deliveries,
    })
  }
}
