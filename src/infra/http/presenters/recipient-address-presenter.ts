import { RecipientAddress } from '@/domain/delivery/enterprise/entities/recipient-address'

export class RecipientAddressPresenter {
  static toHTTP(recipientAddress: RecipientAddress) {
    return {
      id: recipientAddress.id,
      recipientId: recipientAddress.recipientId,
      street: recipientAddress.street,
      number: recipientAddress.number,
      neighborhood: recipientAddress.neighborhood,
      complement: recipientAddress.complement,
      city: recipientAddress.city,
      state: recipientAddress.state,
      country: recipientAddress.country,
      postalCode: recipientAddress.postalCode,
    }
  }
}
