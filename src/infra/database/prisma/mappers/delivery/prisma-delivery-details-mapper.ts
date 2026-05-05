import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { DeliveryDetails } from '@/domain/delivery/application/repositories/read-models/delivery-details'
import { Delivery as PrismaDelivery } from 'generated/prisma/client'

type PrismaDeliveryDetails = PrismaDelivery & {
  recipient: {
    name: string
  }
  courier: {
    name: string
  } | null
}

export class PrismaDeliveryDetailsMapper {
  static toDomain(raw: PrismaDeliveryDetails): DeliveryDetails {
    return DeliveryDetails.create({
      deliveryId: new UniqueEntityID(raw.id),
      recipientId: new UniqueEntityID(raw.recipientId),
      recipientName: raw.recipient.name,
      courierName: raw.courier ? raw.courier.name : null,
      status: raw.status,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    })
  }
}
