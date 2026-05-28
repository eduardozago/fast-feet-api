import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Delivery,
  DeliveryProps,
  DeliveryStatus,
} from '@/domain/delivery/enterprise/entities/delivery'
import { PrismaDeliveryMapper } from '@/infra/database/prisma/mappers/delivery/prisma-delivery-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { Injectable } from '@nestjs/common'

export function makeDelivery(
  override: Partial<DeliveryProps> = {},
  id?: UniqueEntityID,
) {
  const delivery = Delivery.create(
    {
      recipientId: new UniqueEntityID(),
      recipientAddressId: new UniqueEntityID(),
      status: DeliveryStatus.CREATED,
      ...override,
    },
    id,
  )

  return delivery
}

@Injectable()
export class DeliveryFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaDelivery(
    data: Partial<DeliveryProps> = {},
  ): Promise<Delivery> {
    const delivery = makeDelivery(data)

    await this.prisma.delivery.create({
      data: PrismaDeliveryMapper.toPrisma(delivery),
    })

    return delivery
  }
}
