import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { RecipientsRepository } from '../../repositories/recipients-repository'
import { DeliveriesRepository } from '../../repositories/deliveries-repository'
import { Delivery } from '@/domain/delivery/enterprise/entities/delivery'
import { RecipientNotFoundError } from '../recipient/errors/recipient-not-found-error'
import { RecipientAddressesRepository } from '../../repositories/recipient-addresses-repository'
import { RecipientAddressNotFoundError } from '../recipient/errors/recipient-address-not-found-error'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

interface CreateDeliveryUseCaseRequest {
  recipientId: string
  recipientAddressId: string
}

export type CreateDeliveryUseCaseResponse = Either<
  RecipientNotFoundError | RecipientAddressNotFoundError,
  {
    delivery: Delivery
  }
>

@Injectable()
export class CreateDeliveryUseCase {
  constructor(
    private deliveriesRepository: DeliveriesRepository,
    private recipientsRepository: RecipientsRepository,
    private recipientAddressesRepository: RecipientAddressesRepository,
  ) {}

  async execute({
    recipientId,
    recipientAddressId,
  }: CreateDeliveryUseCaseRequest): Promise<CreateDeliveryUseCaseResponse> {
    const recipient = await this.recipientsRepository.findById(recipientId)

    if (!recipient) {
      return left(new RecipientNotFoundError())
    }

    const recipientAddress =
      await this.recipientAddressesRepository.findById(recipientAddressId)

    if (!recipientAddress) {
      return left(new RecipientAddressNotFoundError())
    }

    const delivery = Delivery.create({
      recipientId: new UniqueEntityID(recipientId),
      recipientAddressId: new UniqueEntityID(recipientAddressId),
    })

    await this.deliveriesRepository.create(delivery)

    return right({
      delivery,
    })
  }
}
