import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { DeliveriesRepository } from '../../repositories/deliveries-repository'
import {
  Delivery,
  DeliveryStatus,
} from '@/domain/delivery/enterprise/entities/delivery'
import { DeliveryNotFoundError } from './errors/delivery-not-found-error'
import { CannotWaitForPickupError } from './errors/cannot-wait-for-pickup-error'

interface WaitForPickupUseCaseRequest {
  deliveryId: string
}

export type WaitForPickupUseCaseResponse = Either<
  DeliveryNotFoundError | CannotWaitForPickupError,
  {
    delivery: Delivery
  }
>

@Injectable()
export class WaitForPickupUseCase {
  constructor(private deliveriesRepository: DeliveriesRepository) {}

  async execute({
    deliveryId,
  }: WaitForPickupUseCaseRequest): Promise<WaitForPickupUseCaseResponse> {
    const delivery = await this.deliveriesRepository.findById(deliveryId)

    if (!delivery) {
      return left(new DeliveryNotFoundError())
    }

    if (delivery.status !== DeliveryStatus.CREATED) {
      return left(new CannotWaitForPickupError(delivery.status))
    }

    delivery.waitForPickup()

    await this.deliveriesRepository.update(delivery)

    return right({
      delivery,
    })
  }
}
