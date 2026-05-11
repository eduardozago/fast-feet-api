import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { DeliveriesRepository } from '../../repositories/deliveries-repository'
import { Delivery } from '@/domain/delivery/enterprise/entities/delivery'
import { DeliveryNotFoundError } from './errors/delivery-not-found-error'
import { CannotPickUpDeliveryError } from './errors/cannot-pick-up-error'
import { InvalidCourierAssignedError } from './errors/invalid-courier-assigned-error'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

interface PickUpDeliveryUseCaseRequest {
  deliveryId: string
  courierId: string
}

export type PickUpDeliveryUseCaseResponse = Either<
  | DeliveryNotFoundError
  | CannotPickUpDeliveryError
  | InvalidCourierAssignedError,
  {
    delivery: Delivery
  }
>

@Injectable()
export class PickUpDeliveryUseCase {
  constructor(private deliveriesRepository: DeliveriesRepository) {}

  async execute({
    deliveryId,
    courierId,
  }: PickUpDeliveryUseCaseRequest): Promise<PickUpDeliveryUseCaseResponse> {
    const delivery = await this.deliveriesRepository.findById(deliveryId)

    if (!delivery) {
      return left(new DeliveryNotFoundError())
    }

    if (!delivery.canPickUp()) {
      return left(new CannotPickUpDeliveryError(delivery.status))
    }

    if (!delivery.courierId) {
      return left(
        new InvalidCourierAssignedError('No courier assigned to this delivery'),
      )
    }

    const isCourierAssigned = delivery.courierId.equals(
      new UniqueEntityID(courierId),
    )

    if (!isCourierAssigned) {
      return left(new InvalidCourierAssignedError())
    }

    delivery.pickUp()

    await this.deliveriesRepository.update(delivery)

    return right({
      delivery,
    })
  }
}
