import { PaginationParams } from '@/core/core/pagination-params'
import { Delivery } from '../../enterprise/entities/delivery'
import { Coordinate } from '../../enterprise/entities/value-objects/coordinate'

export abstract class DeliveriesRepository {
  abstract findById(id: string): Promise<Delivery | null>
  abstract findMany(params: PaginationParams): Promise<Delivery[]>
  abstract findNearby(
    courierId: string,
    courierCoordinate: Coordinate,
    radiusInKm: number,
  ): Promise<Delivery[]>
  abstract create(delivery: Delivery): Promise<void>
  abstract update(delivery: Delivery): Promise<void>
  abstract delete(delivery: Delivery): Promise<void>
}
