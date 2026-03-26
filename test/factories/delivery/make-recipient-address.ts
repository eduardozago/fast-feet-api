import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  RecipientAddress,
  RecipientAddressProps,
} from '@/domain/delivery/enterprise/entities/recipient-address'
import { PrismaRecipientAddressMapper } from '@/infra/database/prisma/mappers/delivery/prisma-recipient-address-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'

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

@Injectable()
export class RecipientAddressFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaRecipientAddress(
    data: Partial<RecipientAddressProps> = {},
  ): Promise<RecipientAddress> {
    const recipientAddress = makeRecipientAddress(data)

    await this.prisma.recipientAddress.create({
      data: PrismaRecipientAddressMapper.toPrisma(recipientAddress),
    })

    return recipientAddress
  }
}
