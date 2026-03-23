import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { RecipientAddress } from '@/domain/delivery/enterprise/entities/recipient-address'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { RecipientAddressesRepository } from '../../repositories/recipient-addresses-repository'
import { RecipientsRepository } from '../../repositories/recipients-repository'
import { RecipientNotFoundError } from './errors/recipient-not-found-error'

interface CreateRecipientAddressUseCaseRequest {
  recipientId: string
  street: string
  number: string
  neighborhood: string
  complement?: string
  city: string
  state: string
  country: string
  postalCode: string
}

export type CreateRecipientAddressUseCaseResponse = Either<
  RecipientNotFoundError,
  {
    recipientAddress: RecipientAddress
  }
>

@Injectable()
export class CreateRecipientAddressUseCase {
  constructor(
    private recipientAddressesRepository: RecipientAddressesRepository,
    private recipientsRepository: RecipientsRepository,
  ) {}

  async execute({
    recipientId,
    street,
    number,
    neighborhood,
    complement,
    city,
    state,
    country,
    postalCode,
  }: CreateRecipientAddressUseCaseRequest): Promise<CreateRecipientAddressUseCaseResponse> {
    const recipient = await this.recipientsRepository.findById(recipientId)

    if (!recipient) {
      return left(new RecipientNotFoundError())
    }

    const recipientAddress = RecipientAddress.create({
      recipientId: new UniqueEntityID(recipientId),
      street,
      number,
      neighborhood,
      complement,
      city,
      state,
      country,
      postalCode,
    })

    await this.recipientAddressesRepository.create(recipientAddress)

    return right({
      recipientAddress,
    })
  }
}
