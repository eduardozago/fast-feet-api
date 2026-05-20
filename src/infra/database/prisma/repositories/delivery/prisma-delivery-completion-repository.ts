import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma.service'
import { DeliveryCompletionRepository } from '@/domain/delivery/application/repositories/delivery-completion-repository'
import { ProofOfDelivery } from '@/domain/delivery/enterprise/entities/proof-of-delivery'
import { Delivery } from '@/domain/delivery/enterprise/entities/delivery'
import { PrismaProofOfDeliveryMapper } from '../../mappers/delivery/prisma-proof-of-delivery-mapper'
import { PrismaDeliveryMapper } from '../../mappers/delivery/prisma-delivery-mapper'

@Injectable()
export class PrismaDeliveryCompletionRepository implements DeliveryCompletionRepository {
  constructor(private prisma: PrismaService) {}

  async findProofByDeliveryId(
    deliveryId: string,
  ): Promise<ProofOfDelivery | null> {
    const proof = await this.prisma.proofOfDelivery.findUnique({
      where: {
        deliveryId,
      },
    })

    if (!proof) {
      return null
    }

    return PrismaProofOfDeliveryMapper.toDomain(proof)
  }

  async complete(
    delivery: Delivery,
    proofOfDelivery: ProofOfDelivery,
  ): Promise<void> {
    const proofData = PrismaProofOfDeliveryMapper.toPrisma(proofOfDelivery)
    const deliveryData = PrismaDeliveryMapper.toPrisma(delivery)

    await this.prisma.$transaction(async (tx) => {
      await tx.proofOfDelivery.create({
        data: proofData,
      })

      await tx.delivery.update({
        where: {
          id: delivery.id.toString(),
        },
        data: {
          status: deliveryData.status,
        },
      })
    })
  }
}
