import { Delivery } from '@/domain/delivery/enterprise/entities/delivery'

export class DeliveryPresenter {
  static toHTTP(delivery: Delivery) {
    return {
      id: delivery.id,
      recipientId: delivery.recipientId,
      recipientAddressId: delivery.recipientAddressId,
      courierId: delivery.courierId,
      status: delivery.status,
      createdAt: delivery.createdAt,
      updatedAt: delivery.updatedAt,
    }
  }
}
