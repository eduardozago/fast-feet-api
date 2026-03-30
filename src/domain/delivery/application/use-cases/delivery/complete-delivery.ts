import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { DeliveriesRepository } from '../../repositories/deliveries-repository'
import {
  Delivery,
  DeliveryStatus,
} from '@/domain/delivery/enterprise/entities/delivery'
import { DeliveryNotFoundError } from './errors/delivery-not-found-error'
import { CannotCompleteDeliveryError } from './errors/cannot-complete-delivery-error'

interface CompleteDeliveryUseCaseRequest {
  deliveryId: string
}

export type CompleteDeliveryUseCaseResponse = Either<
  DeliveryNotFoundError | CannotCompleteDeliveryError,
  {
    delivery: Delivery
  }
>

@Injectable()
export class CompleteDeliveryUseCase {
  constructor(private deliveriesRepository: DeliveriesRepository) {}

  async execute({
    deliveryId,
  }: CompleteDeliveryUseCaseRequest): Promise<CompleteDeliveryUseCaseResponse> {
    const delivery = await this.deliveriesRepository.findById(deliveryId)

    if (!delivery) {
      return left(new DeliveryNotFoundError())
    }

    if (delivery.status !== DeliveryStatus.IN_TRANSIT) {
      return left(new CannotCompleteDeliveryError(delivery.status))
    }

    delivery.completed()

    await this.deliveriesRepository.update(delivery)

    return right({
      delivery,
    })
  }
}
