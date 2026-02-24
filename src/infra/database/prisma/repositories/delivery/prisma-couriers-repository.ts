import { Injectable } from '@nestjs/common'
import { CouriersRepository } from '@/domain/delivery/application/repositories/couriers-repository'
import { PrismaService } from '../../prisma.service'
import { Courier } from '@/domain/delivery/enterprise/entities/courier'
import { PrismaCourierMapper } from '../../mappers/delivery/prisma-courier-mapper'

@Injectable()
export class PrismaCouriersRepository implements CouriersRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Courier | null> {
    const courier = await this.prisma.courier.findUnique({
      where: {
        id,
      },
    })

    if (!courier) {
      return null
    }

    return PrismaCourierMapper.toDomain(courier)
  }

  async create(courier: Courier): Promise<void> {
    const data = PrismaCourierMapper.toPrisma(courier)

    await this.prisma.courier.create({
      data,
    })
  }
}
