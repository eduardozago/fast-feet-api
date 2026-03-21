import { RecipientsRepository } from '@/domain/delivery/application/repositories/recipients-repository'
import { Recipient } from '@/domain/delivery/enterprise/entities/recipient'

export class InMemoryRecipientsRepository implements RecipientsRepository {
  public items: Recipient[] = []

  findById(id: string): Promise<Recipient | null> {
    const recipient = this.items.find((item) => item.id.toString() == id)

    if (!recipient) {
      return Promise.resolve(null)
    }

    return Promise.resolve(recipient)
  }

  create(recipient: Recipient): Promise<void> {
    this.items.push(recipient)

    return Promise.resolve()
  }
}
