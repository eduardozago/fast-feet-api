import { AccountsRepository } from '@/domain/identity/application/repositories/accounts-repository'
import { PrismaService } from '../../prisma.service'
import { Account } from '@/domain/identity/enterprise/entities/account'
import { PrismaAccountMapper } from '../../mappers/identity/prisma-account-mapper'
import { Injectable } from '@nestjs/common'

@Injectable()
export class PrismaAccountsRepository implements AccountsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Account | null> {
    const account = await this.prisma.account.findUnique({
      where: {
        id,
      },
    })

    if (!account) {
      return null
    }

    return PrismaAccountMapper.toDomain(account)
  }

  async findByEmail(email: string): Promise<Account | null> {
    const account = await this.prisma.account.findUnique({
      where: {
        email,
      },
    })

    if (!account) {
      return null
    }

    return PrismaAccountMapper.toDomain(account)
  }

  async create(account: Account): Promise<void> {
    const data = PrismaAccountMapper.toPrisma(account)

    await this.prisma.account.create({
      data,
    })
  }

  async update(account: Account): Promise<void> {
    const data = PrismaAccountMapper.toPrisma(account)

    await this.prisma.account.update({
      where: {
        id: data.id,
      },
      data,
    })
  }
}
