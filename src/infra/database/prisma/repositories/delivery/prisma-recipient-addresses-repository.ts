import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma.service'
import { RecipientAddressesRepository } from '@/domain/delivery/application/repositories/recipient-addresses-repository'
import { RecipientAddress } from '@/domain/delivery/enterprise/entities/recipient-address'
import { PrismaRecipientAddressMapper } from '../../mappers/delivery/prisma-recipient-address-mapper'

@Injectable()
export class PrismaRecipientAddressesRepository implements RecipientAddressesRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<RecipientAddress | null> {
    const recipientAddress = await this.prisma.recipientAddress.findUnique({
      where: {
        id,
      },
    })

    if (!recipientAddress) {
      return null
    }

    return PrismaRecipientAddressMapper.toDomain(recipientAddress)
  }

  async findManyByRecipientId(
    recipientId: string,
  ): Promise<RecipientAddress[]> {
    const recipientAddresses = await this.prisma.recipientAddress.findMany({
      where: {
        recipientId,
      },
    })

    return recipientAddresses.map((recipientAddress) =>
      PrismaRecipientAddressMapper.toDomain(recipientAddress),
    )
  }

  async create(recipientAddress: RecipientAddress): Promise<void> {
    const data = PrismaRecipientAddressMapper.toPrisma(recipientAddress)

    await this.prisma.recipientAddress.create({
      data,
    })
  }

  async update(recipientAddress: RecipientAddress): Promise<void> {
    const data = PrismaRecipientAddressMapper.toPrisma(recipientAddress)

    await this.prisma.recipientAddress.update({
      where: {
        id: recipientAddress.id.toString(),
      },
      data,
    })
  }

  async delete(recipientAddress: RecipientAddress): Promise<void> {
    await this.prisma.recipientAddress.delete({
      where: {
        id: recipientAddress.id.toString(),
      },
    })
  }
}
