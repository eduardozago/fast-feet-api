import { PaginationParams } from '@/core/core/pagination-params'
import { DeliveriesRepository } from '@/domain/delivery/application/repositories/deliveries-repository'
import { Delivery } from '@/domain/delivery/enterprise/entities/delivery'
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

  findMany({ page, limit }: PaginationParams): Promise<Delivery[]> {
    const deliveries = this.items.slice((page - 1) * limit, page * limit)

    return Promise.resolve(deliveries)
  }

  findNearby(
    courierId: string,
    courierCoordinate: Coordinate,
    radiusInKm: number,
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

    const deliveries = this.items.filter(
      (item) =>
        item.courierId?.toString() === courierId &&
        nearbyRecipientAddressIds.has(item.recipientAddressId.toString()),
    )

    return Promise.resolve(deliveries)
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
