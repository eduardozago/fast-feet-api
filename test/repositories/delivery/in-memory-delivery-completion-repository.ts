import { DeliveryCompletionRepository } from '@/domain/delivery/application/repositories/delivery-completion-repository'
import { Delivery } from '@/domain/delivery/enterprise/entities/delivery'
import { ProofOfDelivery } from '@/domain/delivery/enterprise/entities/proof-of-delivery'
import { InMemoryDeliveriesRepository } from './in-memory-deliveries-repository'

export class InMemoryDeliveryCompletionRepository implements DeliveryCompletionRepository {
  public items: ProofOfDelivery[] = []

  constructor(private deliveriesRepository: InMemoryDeliveriesRepository) {}

  findProofByDeliveryId(deliveryId: string): Promise<ProofOfDelivery | null> {
    const proofOfDelivery = this.items.find(
      (item) => item.deliveryId.toString() === deliveryId,
    )

    if (!proofOfDelivery) {
      return Promise.resolve(null)
    }

    return Promise.resolve(proofOfDelivery)
  }

  complete(
    delivery: Delivery,
    proofOfDelivery: ProofOfDelivery,
  ): Promise<void> {
    const deliveryIndex = this.deliveriesRepository.items.findIndex((item) =>
      item.id.equals(delivery.id),
    )

    if (deliveryIndex === -1) {
      throw new Error('Delivery not found')
    }

    this.deliveriesRepository.items[deliveryIndex] = delivery
    this.items.push(proofOfDelivery)

    return Promise.resolve()
  }
}
