import { CourierDeliveryDetails } from '@/domain/delivery/application/repositories/read-models/courier-delivery-details'

export class CourierDeliveryDetailsPresenter {
  static toHTTP(deliveryDetails: CourierDeliveryDetails) {
    return {
      id: deliveryDetails.deliveryId,
      recipientId: deliveryDetails.recipientId,
      recipientName: deliveryDetails.recipientName,
      status: deliveryDetails.status,
      createdAt: deliveryDetails.createdAt,
      updatedAt: deliveryDetails.updatedAt,
    }
  }
}
