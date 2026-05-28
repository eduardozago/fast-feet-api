import { Recipient } from '../../enterprise/entities/recipient'

export abstract class RecipientsRepository {
  abstract findById(id: string): Promise<Recipient | null>
  abstract create(recipient: Recipient): Promise<void>
}
