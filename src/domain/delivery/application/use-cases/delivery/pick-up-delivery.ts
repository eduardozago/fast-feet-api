import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { DeliveriesRepository } from '../../repositories/deliveries-repository'
import { CouriersRepository } from '../../repositories/couriers-repository'
import { Delivery } from '@/domain/delivery/enterprise/entities/delivery'
import { DeliveryNotFoundError } from './errors/delivery-not-found-error'
import { CannotPickUpDeliveryError } from './errors/cannot-pick-up-error'
import { InvalidCourierAssignedError } from './errors/invalid-courier-assigned-error'

interface PickUpDeliveryUseCaseRequest {
  deliveryId: string
  accountId: string
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
  constructor(
    private deliveriesRepository: DeliveriesRepository,
    private couriersRepository: CouriersRepository,
  ) {}

  async execute({
    deliveryId,
    accountId,
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

    const courier = await this.couriersRepository.findByAccountId(accountId)

    if (!courier) {
      return left(new InvalidCourierAssignedError())
    }

    const isCourierAssigned = delivery.courierId.equals(courier.id)

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
