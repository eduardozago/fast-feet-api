import { CouriersRepository } from '@/domain/delivery/application/repositories/couriers-repository'
import { Courier } from '@/domain/delivery/enterprise/entities/courier'

export class InMemoryCouriersRepository implements CouriersRepository {
  public items: Courier[] = []

  findById(id: string): Promise<Courier | null> {
    const courier = this.items.find((item) => item.id.toString() == id)

    if (!courier) {
      return Promise.resolve(null)
    }

    return Promise.resolve(courier)
  }

  create(courier: Courier): Promise<void> {
    this.items.push(courier)

    return Promise.resolve()
  }
}
