import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { DeliveriesRepository } from '../../repositories/deliveries-repository'
import { Delivery } from '@/domain/delivery/enterprise/entities/delivery'
import { DeliveryNotFoundError } from './errors/delivery-not-found-error'
import { CannotPickUpDeliveryError } from './errors/cannot-pick-up-error'

interface PickUpDeliveryUseCaseRequest {
  deliveryId: string
}

export type PickUpDeliveryUseCaseResponse = Either<
  DeliveryNotFoundError | CannotPickUpDeliveryError,
  {
    delivery: Delivery
  }
>

@Injectable()
export class PickUpDeliveryUseCase {
  constructor(private deliveriesRepository: DeliveriesRepository) {}

  async execute({
    deliveryId,
  }: PickUpDeliveryUseCaseRequest): Promise<PickUpDeliveryUseCaseResponse> {
    const delivery = await this.deliveriesRepository.findById(deliveryId)

    if (!delivery) {
      return left(new DeliveryNotFoundError())
    }

    if (!delivery.canPickUp()) {
      return left(new CannotPickUpDeliveryError(delivery.status))
    }

    delivery.pickUp()

    await this.deliveriesRepository.update(delivery)

    return right({
      delivery,
    })
  }
}
