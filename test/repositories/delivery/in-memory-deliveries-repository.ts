import { PaginationParams } from '@/core/core/pagination-params'
import { DeliveriesRepository } from '@/domain/delivery/application/repositories/deliveries-repository'
import { Delivery } from '@/domain/delivery/enterprise/entities/delivery'

export class InMemoryDeliveriesRepository implements DeliveriesRepository {
  public items: Delivery[] = []

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
