import { PaginationParams } from '@/core/core/pagination-params'
import { Delivery, DeliveryStatus } from '../../enterprise/entities/delivery'
import { Coordinate } from '../../enterprise/entities/value-objects/coordinate'
import { DeliveryDetails } from './read-models/delivery-details'
import { CourierDeliveryDetails } from './read-models/courier-delivery-details'

export interface FindManyDeliveriesFilters {
  status?: DeliveryStatus
  recipientId?: string
}

export abstract class DeliveriesRepository {
  abstract findById(id: string): Promise<Delivery | null>
  abstract findMany(
    params: PaginationParams,
    filters?: FindManyDeliveriesFilters,
  ): Promise<DeliveryDetails[]>
  abstract findManyByCourierId(
    courierId: string,
    params: PaginationParams,
    filters?: FindManyDeliveriesFilters,
  ): Promise<CourierDeliveryDetails[]>
  abstract findNearbyByCourierId(
    courierId: string,
    courierCoordinate: Coordinate,
    radiusInKm: number,
    params: PaginationParams,
    filters?: FindManyDeliveriesFilters,
  ): Promise<CourierDeliveryDetails[]>
  abstract create(delivery: Delivery): Promise<void>
  abstract update(delivery: Delivery): Promise<void>
  abstract delete(delivery: Delivery): Promise<void>
}
