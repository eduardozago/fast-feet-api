import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { DeliveriesRepository } from '../../repositories/deliveries-repository'
import { DeliveryNotFoundError } from './errors/delivery-not-found-error'

interface DeleteDeliveryUseCaseRequest {
  deliveryId: string
}

export type DeleteDeliveryUseCaseResponse = Either<DeliveryNotFoundError, null>

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

    await this.deliveriesRepository.delete(delivery)

    return right(null)
  }
}
