import { RecipientAddressesRepository } from '@/domain/delivery/application/repositories/recipient-addresses-repository'
import { RecipientAddress } from '@/domain/delivery/enterprise/entities/recipient-address'

export class InMemoryRecipientAddressesRepository implements RecipientAddressesRepository {
  public items: RecipientAddress[] = []

  findById(id: string): Promise<RecipientAddress | null> {
    const recipientAddress = this.items.find((item) => item.id.toString() == id)

    if (!recipientAddress) {
      return Promise.resolve(null)
    }

    return Promise.resolve(recipientAddress)
  }

  findManyByRecipientId(recipientId: string): Promise<RecipientAddress[]> {
    const recipientAddresses = this.items.filter(
      (item) => item.recipientId.toString() === recipientId,
    )

    return Promise.resolve(recipientAddresses)
  }

  create(recipientAddress: RecipientAddress): Promise<void> {
    this.items.push(recipientAddress)

    return Promise.resolve()
  }

  update(recipientAddress: RecipientAddress): Promise<void> {
    const itemIndex = this.items.findIndex((item) =>
      item.id.equals(recipientAddress.id),
    )

    this.items[itemIndex] = recipientAddress

    return Promise.resolve()
  }

  delete(recipientAddress: RecipientAddress): Promise<void> {
    const itemIndex = this.items.findIndex((item) =>
      item.id.equals(recipientAddress.id),
    )

    this.items.splice(itemIndex, 1)

    return Promise.resolve()
  }
}
