import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { DeliveriesRepository } from '../../repositories/deliveries-repository'
import { DeliveryNotFoundError } from './errors/delivery-not-found-error'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'
import { CannotDeleteDeliveryError } from './errors/cannot-delete-delivery-error'

interface DeleteDeliveryUseCaseRequest {
  deliveryId: string
}

export type DeleteDeliveryUseCaseResponse = Either<
  DeliveryNotFoundError | CannotDeleteDeliveryError,
  null
>

@Injectable()
export class DeleteDeliveryUseCase {
  constructor(private deliveriesRepository: DeliveriesRepository) {}

  async execute({
    deliveryId,
  }: DeleteDeliveryUseCaseRequest): Promise<DeleteDeliveryUseCaseResponse> {
    const delivery = await this.deliveriesRepository.findById(deliveryId)

    if (!delivery) {
      return left(new DeliveryNotFoundError())
    }

    if (delivery.status !== DeliveryStatus.CREATED) {
      return left(new CannotDeleteDeliveryError(delivery.status))
    }

    await this.deliveriesRepository.delete(delivery)

    return right(null)
  }
}
