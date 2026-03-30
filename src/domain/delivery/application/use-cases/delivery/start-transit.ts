import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { DeliveriesRepository } from '../../repositories/deliveries-repository'
import {
  Delivery,
  DeliveryStatus,
} from '@/domain/delivery/enterprise/entities/delivery'
import { DeliveryNotFoundError } from './errors/delivery-not-found-error'
import { CannotStartTransitError } from './errors/cannot-start-transit-error'

interface StartTransitUseCaseRequest {
  deliveryId: string
}

export type StartTransitUseCaseResponse = Either<
  DeliveryNotFoundError | CannotStartTransitError,
  {
    delivery: Delivery
  }
>

@Injectable()
export class StartTransitUseCase {
  constructor(private deliveriesRepository: DeliveriesRepository) {}

  async execute({
    deliveryId,
  }: StartTransitUseCaseRequest): Promise<StartTransitUseCaseResponse> {
    const delivery = await this.deliveriesRepository.findById(deliveryId)

    if (!delivery) {
      return left(new DeliveryNotFoundError())
    }

    if (delivery.status !== DeliveryStatus.WAITING_PICKUP) {
      return left(new CannotStartTransitError(delivery.status))
    }

    delivery.inTransit()

    await this.deliveriesRepository.update(delivery)

    return right({
      delivery,
    })
  }
}
