import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { RecipientsRepository } from '../../repositories/recipients-repository'
import { Recipient } from '@/domain/delivery/enterprise/entities/recipient'
import {
  IdentificationType,
  IdentityDocument,
} from '@/domain/delivery/enterprise/entities/value-objects/identity-document'

interface CreateRecipientUseCaseRequest {
  name: string
  identityDocument: {
    type: IdentificationType
    number: string
    issuingCountry: string
  }
}

export type CreateRecipientUseCaseResponse = Either<
  null,
  {
    recipient: Recipient
  }
>

@Injectable()
export class CreateRecipientUseCase {
  constructor(private recipientsRepository: RecipientsRepository) {}

  async execute({
    name,
    identityDocument,
  }: CreateRecipientUseCaseRequest): Promise<CreateRecipientUseCaseResponse> {
    const recipientIdentityDocument = IdentityDocument.create({
      type: identityDocument.type,
      number: identityDocument.number,
      issuingCountry: identityDocument.issuingCountry,
    })

    const recipient = Recipient.create({
      name,
      identityDocument: recipientIdentityDocument,
    })

    await this.recipientsRepository.create(recipient)

    return right({
      recipient,
    })
  }
}
