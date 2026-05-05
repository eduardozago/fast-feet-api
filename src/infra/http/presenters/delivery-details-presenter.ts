import { DeliveryDetails } from '@/domain/delivery/application/repositories/read-models/delivery-details'

export class DeliveryDetailsPresenter {
  static toHTTP(deliveryDetails: DeliveryDetails) {
    return {
      id: deliveryDetails.deliveryId,
      recipientId: deliveryDetails.recipientId,
      courierId: deliveryDetails.courierId,
      recipientName: deliveryDetails.recipientName,
      courierName: deliveryDetails.courierName,
      status: deliveryDetails.status,
      createdAt: deliveryDetails.createdAt,
      updatedAt: deliveryDetails.updatedAt,
    }
  }
}
