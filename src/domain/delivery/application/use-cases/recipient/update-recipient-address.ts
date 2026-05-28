import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { RecipientAddressesRepository } from '../../repositories/recipient-addresses-repository'
import { RecipientAddressNotFoundError } from './errors/recipient-address-not-found-error'
import { GeocodingService } from '../../location/geocoding-service'
import { GeocodingServiceError } from '../errors/geocoding-service-error'

interface UpdateRecipientAddressUseCaseRequest {
  recipientId: string
  recipientAddressId: string
  street: string
  number: string
  neighborhood: string
  complement?: string
  city: string
  state: string
  country: string
  postalCode: string
}

export type UpdateRecipientAddressUseCaseResponse = Either<
  RecipientAddressNotFoundError | GeocodingServiceError,
  null
>

@Injectable()
export class UpdateRecipientAddressUseCase {
  constructor(
    private recipientAddressesRepository: RecipientAddressesRepository,
    private geocodingService: GeocodingService,
  ) {}

  async execute({
    recipientId,
    recipientAddressId,
    street,
    number,
    neighborhood,
    complement,
    city,
    state,
    country,
    postalCode,
  }: UpdateRecipientAddressUseCaseRequest): Promise<UpdateRecipientAddressUseCaseResponse> {
    const recipientAddress =
      await this.recipientAddressesRepository.findById(recipientAddressId)

    if (!recipientAddress) {
      return left(new RecipientAddressNotFoundError())
    }

    if (recipientAddress.recipientId.toString() !== recipientId) {
      return left(new RecipientAddressNotFoundError())
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

    recipientAddress.street = street
    recipientAddress.number = number
    recipientAddress.neighborhood = neighborhood
    recipientAddress.complement = complement
    recipientAddress.city = city
    recipientAddress.state = state
    recipientAddress.country = country
    recipientAddress.postalCode = postalCode
    recipientAddress.latitude = latitude
    recipientAddress.longitude = longitude

    await this.recipientAddressesRepository.update(recipientAddress)

    return right(null)
  }
}
