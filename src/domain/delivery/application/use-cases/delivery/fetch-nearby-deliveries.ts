import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { DeliveriesRepository } from '../../repositories/deliveries-repository'
import { Delivery } from '@/domain/delivery/enterprise/entities/delivery'
import { CouriersRepository } from '../../repositories/couriers-repository'
import { CourierNotFoundError } from '../courier/errors/courier-not-found-error'
import { Coordinate } from '@/domain/delivery/enterprise/entities/value-objects/coordinate'

interface FetchNearbyDeliveriesUseCaseRequest {
  courierId: string
  latitude: number
  longitude: number
  radiusInKm: number
  page: number
  limit: number
}

export type FetchNearbyDeliveriesUseCaseResponse = Either<
  CourierNotFoundError,
  {
    deliveries: Delivery[]
  }
>

@Injectable()
export class FetchNearbyDeliveriesUseCase {
  constructor(
    private deliveriesRepository: DeliveriesRepository,
    private couriersRepository: CouriersRepository,
  ) {}

  async execute({
    courierId,
    latitude,
    longitude,
    radiusInKm,
    page,
    limit,
  }: FetchNearbyDeliveriesUseCaseRequest): Promise<FetchNearbyDeliveriesUseCaseResponse> {
    const courier = await this.couriersRepository.findById(courierId)

    if (!courier) {
      return left(new CourierNotFoundError())
    }

    const courierCoordinate = Coordinate.create({
      latitude,
      longitude,
    })

    const deliveries = await this.deliveriesRepository.findNearby(
      courierId,
      courierCoordinate,
      radiusInKm,
      {
        page,
        limit,
      },
    )

    return right({
      deliveries,
    })
  }
}
