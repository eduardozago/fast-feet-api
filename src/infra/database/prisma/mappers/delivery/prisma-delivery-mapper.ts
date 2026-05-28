import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Delivery } from '@/domain/delivery/enterprise/entities/delivery'
import { Prisma, Delivery as PrismaDelivery } from 'generated/prisma/client'

export class PrismaDeliveryMapper {
  static toDomain(raw: PrismaDelivery) {
    const courierId = raw.courierId ? new UniqueEntityID(raw.courierId) : null
    return Delivery.create(
      {
        recipientId: new UniqueEntityID(raw.recipientId),
        recipientAddressId: new UniqueEntityID(raw.recipientAddressId),
        courierId,
        status: raw.status,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(delivery: Delivery): Prisma.DeliveryUncheckedCreateInput {
    return {
      id: delivery.id.toString(),
      courierId: delivery.courierId?.toString(),
      recipientId: delivery.recipientId.toString(),
      recipientAddressId: delivery.recipientAddressId.toString(),
      status: delivery.status,
      createdAt: delivery.createdAt,
      updatedAt: delivery.updatedAt,
    }
  }
}
