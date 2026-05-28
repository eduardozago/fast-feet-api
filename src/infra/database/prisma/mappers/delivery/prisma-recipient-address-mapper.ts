import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { RecipientAddress } from '@/domain/delivery/enterprise/entities/recipient-address'
import {
  Prisma,
  RecipientAddress as PrismaRecipientAddress,
} from 'generated/prisma/client'

export class PrismaRecipientAddressMapper {
  private static parseDecimal(raw: Prisma.Decimal) {
    return Number(raw)
  }

  static toDomain(raw: PrismaRecipientAddress) {
    return RecipientAddress.create(
      {
        recipientId: new UniqueEntityID(raw.recipientId),
        street: raw.street,
        number: raw.number,
        neighborhood: raw.neighborhood,
        complement: raw.complement,
        city: raw.city,
        state: raw.state,
        country: raw.country,
        postalCode: raw.postalCode,
        latitude: this.parseDecimal(raw.latitude),
        longitude: this.parseDecimal(raw.longitude),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(
    recipientAddress: RecipientAddress,
  ): Prisma.RecipientAddressUncheckedCreateInput {
    return {
      id: recipientAddress.id.toString(),
      recipientId: recipientAddress.recipientId.toString(),
      street: recipientAddress.street,
      number: recipientAddress.number,
      neighborhood: recipientAddress.neighborhood,
      complement: recipientAddress.complement,
      city: recipientAddress.city,
      state: recipientAddress.state,
      country: recipientAddress.country,
      postalCode: recipientAddress.postalCode,
      latitude: recipientAddress.latitude,
      longitude: recipientAddress.longitude,
      createdAt: recipientAddress.createdAt,
      updatedAt: recipientAddress.updatedAt,
    }
  }
}
