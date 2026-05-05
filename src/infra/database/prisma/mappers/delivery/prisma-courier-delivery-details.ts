import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { CourierDeliveryDetails } from '@/domain/delivery/application/repositories/read-models/courier-delivery-details'
import { Delivery as PrismaDelivery } from 'generated/prisma/client'

type PrismaCourierDeliveryDetails = PrismaDelivery & {
  recipient: {
    name: string
  }
}

export class PrismaCourierDeliveryDetailsMapper {
  static toDomain(raw: PrismaCourierDeliveryDetails): CourierDeliveryDetails {
    return CourierDeliveryDetails.create({
      deliveryId: new UniqueEntityID(raw.id),
      recipientId: new UniqueEntityID(raw.recipientId),
      recipientName: raw.recipient.name,
      status: raw.status,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    })
  }
}
