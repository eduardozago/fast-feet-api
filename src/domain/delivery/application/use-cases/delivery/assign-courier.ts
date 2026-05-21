import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { DeliveriesRepository } from '../../repositories/deliveries-repository'
import { Delivery } from '@/domain/delivery/enterprise/entities/delivery'
import { DeliveryNotFoundError } from './errors/delivery-not-found-error'
import { CannotAssignCourierError } from './errors/cannot-assign-courier-error'
import { CouriersRepository } from '../../repositories/couriers-repository'
import { CourierNotFoundError } from '../courier/errors/courier-not-found-error'

interface AssignCourierUseCaseRequest {
  deliveryId: string
  courierId: string
}

export type AssignCourierUseCaseResponse = Either<
  DeliveryNotFoundError | CannotAssignCourierError | CourierNotFoundError,
  {
    delivery: Delivery
  }
>

@Injectable()
export class AssignCourierUseCase {
  constructor(
    private deliveriesRepository: DeliveriesRepository,
    private courierRepository: CouriersRepository,
  ) {}

  async execute({
    deliveryId,
    courierId,
  }: AssignCourierUseCaseRequest): Promise<AssignCourierUseCaseResponse> {
    const delivery = await this.deliveriesRepository.findById(deliveryId)

    if (!delivery) {
      return left(new DeliveryNotFoundError())
    }

    if (!delivery.canAssignCourier()) {
      return left(new CannotAssignCourierError(delivery.status))
    }

    const courier = await this.courierRepository.findById(courierId)

    if (!courier) {
      return left(new CourierNotFoundError())
    }

    delivery.assignCourier(courier.id)

    await this.deliveriesRepository.update(delivery)

    return right({
      delivery,
    })
  }
}
