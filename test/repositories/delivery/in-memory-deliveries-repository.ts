import { PaginationParams } from '@/core/core/pagination-params'
import { DeliveriesRepository, FindManyDeliveriesFilters } from '@/domain/delivery/application/repositories/deliveries-repository'
import {
  Delivery,
  DeliveryStatus,
} from '@/domain/delivery/enterprise/entities/delivery'
import { Coordinate } from '@/domain/delivery/enterprise/entities/value-objects/coordinate'
import { InMemoryRecipientAddressesRepository } from './in-memory-recipient-addresses-repository'

export class InMemoryDeliveriesRepository implements DeliveriesRepository {
  public items: Delivery[] = []

  constructor(
    private recipientAddressesRepository?: InMemoryRecipientAddressesRepository,
  ) {}

  findById(id: string): Promise<Delivery | null> {
    const delivery = this.items.find((item) => item.id.toString() == id)

    if (!delivery) {
      return Promise.resolve(null)
    }

    return Promise.resolve(delivery)
  }

  findMany(
    { page, limit }: PaginationParams,
    { status, recipientId }: FindManyDeliveriesFilters = {},
  ): Promise<Delivery[]> {
    let deliveries = this.items

    if (recipientId) {
      deliveries = deliveries.filter(
        (item) => item.recipientId.toString() === recipientId,
      )
    }

    if (status) {
      deliveries = deliveries.filter((item) => item.status === status)
    }

    deliveries = deliveries.slice((page - 1) * limit, page * limit)

    return Promise.resolve(deliveries)
  }

  findManyByCourierId(
    courierId: string,
    { page, limit }: PaginationParams,
    { status, recipientId }: FindManyDeliveriesFilters,
  ): Promise<Delivery[]> {
    let deliveries = this.items.filter(
      (item) => item.courierId && item.courierId.toString() === courierId,
    )

    if (recipientId) {
      deliveries = deliveries.filter(
        (item) => item.recipientId.toString() === recipientId,
      )
    }

    if (status) {
      deliveries = deliveries.filter((item) => item.status === status)
    }

    deliveries = deliveries.slice((page - 1) * limit, page * limit)

    return Promise.resolve(deliveries)
  }

  findNearbyByCourierId(
    courierId: string,
    courierCoordinate: Coordinate,
    radiusInKm: number,
    { page, limit }: PaginationParams,
    { status, recipientId }: FindManyDeliveriesFilters,
  ): Promise<Delivery[]> {
    if (!this.recipientAddressesRepository) {
      throw new Error('Recipient addresses repository not provided')
    }

    const nearbyRecipientAddressIds = new Set(
      this.recipientAddressesRepository.items
        .filter((address) => {
          const recipientCoordinate = Coordinate.create({
            latitude: address.latitude,
            longitude: address.longitude,
          })
          const distanceInKm = courierCoordinate.distanceTo(recipientCoordinate)

          return distanceInKm <= radiusInKm
        })
        .map((address) => address.id.toString()),
    )

    let deliveries = this.items.filter(
      (item) =>
        item.courierId &&
        item.courierId.toString() === courierId &&
        nearbyRecipientAddressIds.has(item.recipientAddressId.toString()),
    )

    if (status) {
      deliveries = deliveries.filter((item) => item.status === status)
    }

    if (recipientId) {
      deliveries = deliveries.filter(
        (item) => item.recipientId.toString() === recipientId,
      )
    }

    const paginatedDeliveries = deliveries.slice(
      (page - 1) * limit,
      page * limit,
    )

    return Promise.resolve(paginatedDeliveries)
  }

  create(delivery: Delivery): Promise<void> {
    this.items.push(delivery)

    return Promise.resolve()
  }

  update(delivery: Delivery): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === delivery.id.toString(),
    )

    if (index !== -1) {
      this.items[index] = delivery
    }

    return Promise.resolve()
  }

  delete(delivery: Delivery): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === delivery.id.toString(),
    )

    if (index !== -1) {
      this.items.splice(index, 1)
    }

    return Promise.resolve()
  }
}
