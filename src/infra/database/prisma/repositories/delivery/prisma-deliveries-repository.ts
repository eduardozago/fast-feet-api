import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma.service'
import { Delivery } from '@/domain/delivery/enterprise/entities/delivery'
import { PrismaDeliveryMapper } from '../../mappers/delivery/prisma-delivery-mapper'
import {
  DeliveriesRepository,
  FindManyDeliveriesFilters,
} from '@/domain/delivery/application/repositories/deliveries-repository'
import { PaginationParams } from '@/core/core/pagination-params'
import { Coordinate } from '@/domain/delivery/enterprise/entities/value-objects/coordinate'
import { DeliveryStatus } from 'generated/prisma/enums'
import { DeliveryDetails } from '@/domain/delivery/application/repositories/read-models/delivery-details'
import { CourierDeliveryDetails } from '@/domain/delivery/application/repositories/read-models/courier-delivery-details'
import { PrismaDeliveryDetailsMapper } from '../../mappers/delivery/prisma-delivery-details-mapper'
import { PrismaCourierDeliveryDetailsMapper } from '../../mappers/delivery/prisma-courier-delivery-details'

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

  async findMany(
    { page, limit }: PaginationParams,
    { status, recipientId }: FindManyDeliveriesFilters = {},
  ): Promise<DeliveryDetails[]> {
    const deliveries = await this.prisma.delivery.findMany({
      where: {
        ...(status && { status }),
        ...(recipientId && { recipientId }),
      },
      include: {
        recipient: {
          select: {
            name: true,
          },
        },
        courier: {
          select: {
            name: true,
          },
        },
      },
      take: limit,
      skip: (page - 1) * limit,
    })

    return deliveries.map((delivery) =>
      PrismaDeliveryDetailsMapper.toDomain(delivery),
    )
  }

  async findManyByCourierId(
    courierId: string,
    { page, limit }: PaginationParams,
    { status, recipientId }: FindManyDeliveriesFilters = {},
  ): Promise<CourierDeliveryDetails[]> {
    const deliveries = await this.prisma.delivery.findMany({
      where: {
        courierId,
        ...(status && { status }),
        ...(recipientId && { recipientId }),
      },
      include: {
        recipient: {
          select: {
            name: true,
          },
        },
      },
      take: limit,
      skip: (page - 1) * limit,
    })

    return deliveries.map((delivery) =>
      PrismaCourierDeliveryDetailsMapper.toDomain(delivery),
    )
  }

  async findNearbyByCourierId(
    courierId: string,
    courierCoordinate: Coordinate,
    radiusInKm: number,
    { page, limit }: PaginationParams,
    { status, recipientId }: FindManyDeliveriesFilters = {},
  ): Promise<CourierDeliveryDetails[]> {
    const latitudeDelta = radiusInKm / 111
    const longitudeDivisor =
      111 *
      Math.max(Math.cos((courierCoordinate.latitude * Math.PI) / 180), 0.000001)
    const longitudeDelta = radiusInKm / longitudeDivisor

    const deliveries = await this.prisma.delivery.findMany({
      where: {
        courierId,
        recipientAddress: {
          latitude: {
            gte: courierCoordinate.latitude - latitudeDelta,
            lte: courierCoordinate.latitude + latitudeDelta,
          },
          longitude: {
            gte: courierCoordinate.longitude - longitudeDelta,
            lte: courierCoordinate.longitude + longitudeDelta,
          },
        },
        status: status ?? DeliveryStatus.IN_TRANSIT,
        ...(recipientId && { recipientId }),
      },
      include: {
        recipientAddress: true,
        recipient: {
          select: {
            name: true,
          },
        },
      },
    })

    const nearbyDeliveries = deliveries
      .map((delivery) => {
        const recipientCoordinate = Coordinate.create({
          latitude: Number(delivery.recipientAddress.latitude),
          longitude: Number(delivery.recipientAddress.longitude),
        })

        return {
          delivery,
          distanceInKm: courierCoordinate.distanceTo(recipientCoordinate),
        }
      })
      .filter(({ distanceInKm }) => distanceInKm <= radiusInKm)
      .sort((a, b) => a.distanceInKm - b.distanceInKm)
      .map(({ delivery }) => delivery)

    const paginatedDeliveries = nearbyDeliveries.slice(
      (page - 1) * limit,
      page * limit,
    )

    return paginatedDeliveries.map((delivery) =>
      PrismaCourierDeliveryDetailsMapper.toDomain(delivery),
    )
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
