import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  RecipientAddress,
  RecipientAddressProps,
} from '@/domain/delivery/enterprise/entities/recipient-address'
import { faker } from '@faker-js/faker'

export function makeRecipientAddress(
  override: Partial<RecipientAddressProps> = {},
  id?: UniqueEntityID,
) {
  const address = RecipientAddress.create(
    {
      recipientId: new UniqueEntityID(),
      street: faker.location.street(),
      number: faker.location.buildingNumber(),
      neighborhood: faker.location.city(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      postalCode: faker.location.zipCode(),
      ...override,
    },
    id,
  )

  return address
}
