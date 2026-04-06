import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Courier,
  CourierProps,
} from '@/domain/delivery/enterprise/entities/courier'
import { PrismaCourierMapper } from '@/infra/database/prisma/mappers/delivery/prisma-courier-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { Injectable } from '@nestjs/common'

export function makeCourier(
  override: Partial<CourierProps> = {},
  id?: UniqueEntityID,
) {
  const courier = Courier.create(
    {
      name: 'John Doe',
      accountId: new UniqueEntityID(),
      ...override,
    },
    id,
  )

  return courier
}

@Injectable()
export class CourierFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaCourier(data: Partial<CourierProps> = {}): Promise<Courier> {
    const courier = makeCourier(data)

    await this.prisma.courier.create({
      data: PrismaCourierMapper.toPrisma(courier),
    })

    return courier
  }
}
