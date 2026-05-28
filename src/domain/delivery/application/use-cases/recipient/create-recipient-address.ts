import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { RecipientAddress } from '@/domain/delivery/enterprise/entities/recipient-address'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { RecipientAddressesRepository } from '../../repositories/recipient-addresses-repository'
import { RecipientsRepository } from '../../repositories/recipients-repository'
import { RecipientNotFoundError } from './errors/recipient-not-found-error'
import { GeocodingService } from '../../location/geocoding-service'
import { GeocodingServiceError } from '../errors/geocoding-service-error'

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
  RecipientNotFoundError | GeocodingServiceError,
  {
    recipientAddress: RecipientAddress
  }
>

@Injectable()
export class CreateRecipientAddressUseCase {
  constructor(
    private recipientAddressesRepository: RecipientAddressesRepository,
    private recipientsRepository: RecipientsRepository,
    private geocodingService: GeocodingService,
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

    const geocodingResult = await this.geocodingService.geocode({
      street,
      number,
      neighborhood,
      city,
      state,
      country,
      postalCode,
    })

    if (geocodingResult.isLeft()) {
      return left(geocodingResult.value)
    }

    const { latitude, longitude } = geocodingResult.value

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
      latitude,
      longitude,
    })

    await this.recipientAddressesRepository.create(recipientAddress)

    return right({
      recipientAddress,
    })
  }
}
