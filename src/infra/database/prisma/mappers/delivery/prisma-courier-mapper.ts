import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Courier } from '@/domain/delivery/enterprise/entities/courier'
import { Prisma, Courier as PrismaCourier } from 'generated/prisma/client'

export class PrismaCourierMapper {
  static toDomain(raw: PrismaCourier) {
    return Courier.create(
      {
        accountId: new UniqueEntityID(raw.accountId),
        name: raw.name,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(courier: Courier): Prisma.CourierUncheckedCreateInput {
    return {
      id: courier.id.toString(),
      accountId: courier.accountId.toString(),
      name: courier.name,
      createdAt: courier.createdAt,
      updatedAt: courier.updatedAt,
    }
  }
}
