import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { RecipientAddress } from '@/domain/delivery/enterprise/entities/recipient-address'
import { RecipientAddressesRepository } from '../../repositories/recipient-addresses-repository'

interface FetchRecipientAddressesUseCaseRequest {
  recipientId: string
}

export type FetchRecipientAddressesUseCaseResponse = Either<
  null,
  {
    recipientAddresses: RecipientAddress[]
  }
>

@Injectable()
export class FetchRecipientAddressesUseCase {
  constructor(
    private recipientAddressesRepository: RecipientAddressesRepository,
  ) {}

  async execute({
    recipientId,
  }: FetchRecipientAddressesUseCaseRequest): Promise<FetchRecipientAddressesUseCaseResponse> {
    const recipientAddresses =
      await this.recipientAddressesRepository.findManyByRecipientId(recipientId)

    return right({
      recipientAddresses,
    })
  }
}
