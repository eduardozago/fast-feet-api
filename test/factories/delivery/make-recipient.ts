import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { faker } from '@faker-js/faker'
import {
  Recipient,
  RecipientProps,
} from '@/domain/delivery/enterprise/entities/recipient'
import { makeIdentityDocument } from './make-identity-type'

export function makeRecipient(
  override: Partial<RecipientProps> = {},
  id?: UniqueEntityID,
) {
  const recipient = Recipient.create(
    {
      name: faker.person.fullName(),
      identityDocument: makeIdentityDocument(),
      ...override,
    },
    id,
  )

  return recipient
}
