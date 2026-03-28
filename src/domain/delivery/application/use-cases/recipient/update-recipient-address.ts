import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { RecipientAddress } from '@/domain/delivery/enterprise/entities/recipient-address'
import { RecipientAddressesRepository } from '../../repositories/recipient-addresses-repository'
import { RecipientAddressNotFoundError } from './errors/recipient-address-not-found-error'

interface UpdateRecipientAddressUseCaseRequest {
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
  RecipientAddressNotFoundError,
  {
    recipientAddress: RecipientAddress
  }
>

@Injectable()
export class UpdateRecipientAddressUseCase {
  constructor(
    private recipientAddressesRepository: RecipientAddressesRepository,
  ) {}

  async execute({
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

    recipientAddress.street = street
    recipientAddress.number = number
    recipientAddress.neighborhood = neighborhood
    recipientAddress.complement = complement
    recipientAddress.city = city
    recipientAddress.state = state
    recipientAddress.country = country
    recipientAddress.postalCode = postalCode

    await this.recipientAddressesRepository.update(recipientAddress)

    return right({
      recipientAddress,
    })
  }
}
