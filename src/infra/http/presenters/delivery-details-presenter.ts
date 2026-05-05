import { DeliveryDetails } from '@/domain/delivery/application/repositories/read-models/delivery-details'

export class DeliveryDetailsPresenter {
  static toHTTP(deliveryDetails: DeliveryDetails) {
    return {
      id: deliveryDetails.deliveryId.toString(),
      recipientId: deliveryDetails.recipientId.toString(),
      courierId: deliveryDetails.courierId
        ? deliveryDetails.courierId.toString()
        : null,
      recipientName: deliveryDetails.recipientName,
      courierName: deliveryDetails.courierName,
      status: deliveryDetails.status,
      createdAt: deliveryDetails.createdAt,
      updatedAt: deliveryDetails.updatedAt,
    }
  }
}
