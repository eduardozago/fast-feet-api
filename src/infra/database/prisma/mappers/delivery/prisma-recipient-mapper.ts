import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Recipient } from '@/domain/delivery/enterprise/entities/recipient'
import { IdentityDocument } from '@/domain/delivery/enterprise/entities/value-objects/identity-document'
import { Prisma, Recipient as PrismaRecipient } from 'generated/prisma/client'

export class PrismaRecipientMapper {
  static toDomain(raw: PrismaRecipient) {
    const identityDocument = IdentityDocument.create({
      type: raw.identityDocumentType,
      number: raw.identityDocumentNumber,
      issuingCountry: raw.identityIssuingCountry,
    })

    return Recipient.create(
      {
        name: raw.name,
        identityDocument,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(recipient: Recipient): Prisma.RecipientUncheckedCreateInput {
    return {
      id: recipient.id.toString(),
      name: recipient.name,
      identityDocumentType: recipient.identityDocument.type,
      identityDocumentNumber: recipient.identityDocument.number,
      identityIssuingCountry: recipient.identityDocument.issuingCountry,
      createdAt: recipient.createdAt,
      updatedAt: recipient.updatedAt,
    }
  }
}
