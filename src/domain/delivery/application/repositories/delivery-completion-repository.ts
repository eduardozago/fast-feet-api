import { Delivery } from '../../enterprise/entities/delivery'
import { ProofOfDelivery } from '../../enterprise/entities/proof-of-delivery'

export abstract class DeliveryCompletionRepository {
  abstract findProofByDeliveryId(
    deliveryId: string,
  ): Promise<ProofOfDelivery | null>
  abstract complete(
    delivery: Delivery,
    proofOfDelivery: ProofOfDelivery,
  ): Promise<void>
}
