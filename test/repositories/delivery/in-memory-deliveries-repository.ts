import { PaginationParams } from '@/core/core/pagination-params'
import {
  DeliveriesRepository,
  FindManyDeliveriesFilters,
} from '@/domain/delivery/application/repositories/deliveries-repository'
import { Delivery } from '@/domain/delivery/enterprise/entities/delivery'
import { Coordinate } from '@/domain/delivery/enterprise/entities/value-objects/coordinate'
import { InMemoryRecipientAddressesRepository } from './in-memory-recipient-addresses-repository'
import { DeliveryDetails } from '@/domain/delivery/application/repositories/read-models/delivery-details'
import { CourierDeliveryDetails } from '@/domain/delivery/application/repositories/read-models/courier-delivery-details'
import { InMemoryRecipientsRepository } from './in-memory-recipients-repository'
import { InMemoryCouriersRepository } from './in-memory-couriers-repository'

export class InMemoryDeliveriesRepository implements DeliveriesRepository {
  public items: Delivery[] = []

  constructor(
    private recipientAddressesRepository?: InMemoryRecipientAddressesRepository,
    private recipientsRepository?: InMemoryRecipientsRepository,
    private couriersRepository?: InMemoryCouriersRepository,
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
  ): Promise<DeliveryDetails[]> {
    if (!this.recipientsRepository) {
      throw new Error('Recipients repository not provided')
    }

    if (!this.couriersRepository) {
      throw new Error('Couriers repository not provided')
    }

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

    const deliveriesDetails: DeliveryDetails[] = deliveries.map((delivery) => {
      const recipient = this.recipientsRepository?.items.find(
        (item) => item.id.toString() === delivery.recipientId.toString(),
      )

      if (!recipient) {
        throw new Error('Recipient not found')
      }

      const courier = this.couriersRepository?.items.find(
        (item) => item.id.toString() === delivery.courierId?.toString(),
      )

      return DeliveryDetails.create({
        deliveryId: delivery.id,
        recipientId: delivery.recipientId,
        courierId: courier ? courier.id : null,
        recipientName: recipient.name,
        courierName: courier ? courier.name : null,
        status: delivery.status,
        createdAt: delivery.createdAt,
        updatedAt: delivery.updatedAt,
      })
    })

    return Promise.resolve(deliveriesDetails)
  }

  findManyByCourierId(
    courierId: string,
    { page, limit }: PaginationParams,
    { status, recipientId }: FindManyDeliveriesFilters = {},
  ): Promise<CourierDeliveryDetails[]> {
    if (!this.recipientsRepository) {
      throw new Error('Recipients repository not provided')
    }

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

    const deliveriesDetails: CourierDeliveryDetails[] = deliveries.map(
      (delivery) => {
        const recipient = this.recipientsRepository?.items.find(
          (item) => item.id.toString() === delivery.recipientId.toString(),
        )

        if (!recipient) {
          throw new Error('Recipient not found')
        }

        return CourierDeliveryDetails.create({
          deliveryId: delivery.id,
          recipientId: delivery.recipientId,
          recipientName: recipient.name,
          status: delivery.status,
          createdAt: delivery.createdAt,
          updatedAt: delivery.updatedAt,
        })
      },
    )

    return Promise.resolve(deliveriesDetails)
  }

  findNearbyByCourierId(
    courierId: string,
    courierCoordinate: Coordinate,
    radiusInKm: number,
    { page, limit }: PaginationParams,
    { status, recipientId }: FindManyDeliveriesFilters = {},
  ): Promise<CourierDeliveryDetails[]> {
    if (!this.recipientAddressesRepository) {
      throw new Error('Recipient addresses repository not provided')
    }

    if (!this.recipientsRepository) {
      throw new Error('Recipients repository not provided')
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

    const deliveriesDetails: CourierDeliveryDetails[] = deliveries.map(
      (delivery) => {
        const recipient = this.recipientsRepository?.items.find(
          (item) => item.id.toString() === delivery.recipientId.toString(),
        )

        if (!recipient) {
          throw new Error('Recipient not found')
        }

        return CourierDeliveryDetails.create({
          deliveryId: delivery.id,
          recipientId: delivery.recipientId,
          recipientName: recipient.name,
          status: delivery.status,
          createdAt: delivery.createdAt,
          updatedAt: delivery.updatedAt,
        })
      },
    )

    const paginatedDeliveries = deliveriesDetails.slice(
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
