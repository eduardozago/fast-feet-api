import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Delivery,
  DeliveryProps,
} from '@/domain/delivery/enterprise/entities/delivery'

export function makeDelivery(
  override: Partial<DeliveryProps> = {},
  id?: UniqueEntityID,
) {
  const delivery = Delivery.create(
    {
      recipientId: new UniqueEntityID(),
      recipientAddressId: new UniqueEntityID(),
      ...override,
    },
    id,
  )

  return delivery
}
