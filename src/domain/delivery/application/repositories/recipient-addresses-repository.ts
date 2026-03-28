import { RecipientAddress } from '../../enterprise/entities/recipient-address'

export abstract class RecipientAddressesRepository {
  abstract findById(id: string): Promise<RecipientAddress | null>
  abstract findManyByRecipientId(
    recipientId: string,
  ): Promise<RecipientAddress[]>
  abstract create(recipientAddress: RecipientAddress): Promise<void>
  abstract update(recipientAddress: RecipientAddress): Promise<void>
  abstract delete(recipientAddress: RecipientAddress): Promise<void>
}
