import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { DeliveriesRepository } from '../../repositories/deliveries-repository'
import {
  Delivery,
  DeliveryStatus,
} from '@/domain/delivery/enterprise/entities/delivery'
import { DeliveryNotFoundError } from './errors/delivery-not-found-error'
import { CannotStartTransitError } from './errors/cannot-start-transit-error'
import { CouriersRepository } from '../../repositories/couriers-repository'
import { CourierNotFoundError } from '../courier/errors/courier-not-found-error'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

interface StartTransitUseCaseRequest {
  deliveryId: string
  courierId: string
}

export type StartTransitUseCaseResponse = Either<
  DeliveryNotFoundError | CannotStartTransitError | CourierNotFoundError,
  {
    delivery: Delivery
  }
>

@Injectable()
export class StartTransitUseCase {
  constructor(
    private deliveriesRepository: DeliveriesRepository,
    private couriersRepository: CouriersRepository,
  ) {}

  async execute({
    deliveryId,
    courierId,
  }: StartTransitUseCaseRequest): Promise<StartTransitUseCaseResponse> {
    const delivery = await this.deliveriesRepository.findById(deliveryId)

    if (!delivery) {
      return left(new DeliveryNotFoundError())
    }

    if (delivery.status !== DeliveryStatus.WAITING_PICKUP) {
      return left(new CannotStartTransitError(delivery.status))
    }

    const courier = await this.couriersRepository.findById(courierId)

    if (!courier) {
      return left(new CourierNotFoundError())
    }

    delivery.inTransit(new UniqueEntityID(courierId))

    await this.deliveriesRepository.update(delivery)

    return right({
      delivery,
    })
  }
}
