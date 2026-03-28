import { Delivery } from '../../enterprise/entities/delivery'

export abstract class DeliveriesRepository {
  abstract findById(id: string): Promise<Delivery | null>
  abstract create(delivery: Delivery): Promise<void>
}
