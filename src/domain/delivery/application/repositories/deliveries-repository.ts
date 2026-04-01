import { PaginationParams } from '@/core/core/pagination-params'
import { Delivery } from '../../enterprise/entities/delivery'

export abstract class DeliveriesRepository {
  abstract findById(id: string): Promise<Delivery | null>
  abstract findMany(params: PaginationParams): Promise<Delivery[]>
  abstract create(delivery: Delivery): Promise<void>
  abstract update(delivery: Delivery): Promise<void>
}
