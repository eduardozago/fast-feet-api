import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { RecipientAddressesRepository } from '../../repositories/recipient-addresses-repository'
import { RecipientAddressNotFoundError } from './errors/recipient-address-not-found-error'

interface DeleteRecipientAddressUseCaseRequest {
  recipientAddressId: string
}

export type DeleteRecipientAddressUseCaseResponse = Either<
  RecipientAddressNotFoundError,
  null
>

@Injectable()
export class DeleteRecipientAddressUseCase {
  constructor(
    private recipientAddressesRepository: RecipientAddressesRepository,
  ) {}

  async execute({
    recipientAddressId,
  }: DeleteRecipientAddressUseCaseRequest): Promise<DeleteRecipientAddressUseCaseResponse> {
    const recipientAddress =
      await this.recipientAddressesRepository.findById(recipientAddressId)

    if (!recipientAddress) {
      return left(new RecipientAddressNotFoundError())
    }

    await this.recipientAddressesRepository.delete(recipientAddress)

    return right(null)
  }
}
