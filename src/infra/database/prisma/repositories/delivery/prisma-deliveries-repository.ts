import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma.service'
import { Delivery } from '@/domain/delivery/enterprise/entities/delivery'
import { PrismaDeliveryMapper } from '../../mappers/delivery/prisma-delivery-mapper'
import { DeliveriesRepository } from '@/domain/delivery/application/repositories/deliveries-repository'
import { PaginationParams } from '@/core/core/pagination-params'

@Injectable()
export class PrismaDeliveriesRepository implements DeliveriesRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Delivery | null> {
    const delivery = await this.prisma.delivery.findUnique({
      where: {
        id,
      },
    })

    if (!delivery) {
      return null
    }

    return PrismaDeliveryMapper.toDomain(delivery)
  }

  async findMany({ page, limit }: PaginationParams): Promise<Delivery[]> {
    const deliveries = await this.prisma.delivery.findMany({
      take: limit,
      skip: (page - 1) * limit,
    })

    return deliveries.map((delivery) => PrismaDeliveryMapper.toDomain(delivery))
  }

  async create(delivery: Delivery): Promise<void> {
    const data = PrismaDeliveryMapper.toPrisma(delivery)

    await this.prisma.delivery.create({
      data,
    })
  }

  async update(delivery: Delivery): Promise<void> {
    const data = PrismaDeliveryMapper.toPrisma(delivery)
    await this.prisma.delivery.update({
      where: {
        id: delivery.id.toString(),
      },
      data,
    })
  }

  async delete(delivery: Delivery): Promise<void> {
    await this.prisma.delivery.delete({
      where: {
        id: delivery.id.toString(),
      },
    })
  }
}
