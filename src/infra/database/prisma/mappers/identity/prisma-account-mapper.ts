import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Account,
  AccountRole,
} from '@/domain/identity/enterprise/entities/account'
import {
  Prisma,
  Account as PrismaAccount,
  AccountRole as PrismaAccountRole,
} from 'generated/prisma/client'

export class PrismaAccountMapper {
  static toDomain(raw: PrismaAccount) {
    return Account.create(
      {
        email: raw.email,
        password: raw.password,
        role: this.toDomainRoleMap[raw.role],
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(account: Account): Prisma.AccountUncheckedCreateInput {
    return {
      id: account.id.toString(),
      email: account.email,
      password: account.password,
      role: this.toPrismaRoleMap[account.role],
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }
  }

  private static toDomainRoleMap: Record<PrismaAccountRole, AccountRole> = {
    [PrismaAccountRole.ADMIN]: AccountRole.ADMIN,
    [PrismaAccountRole.WORKER]: AccountRole.ADMIN,
  }

  private static toPrismaRoleMap: Record<string, PrismaAccountRole> = {
    ADMIN: PrismaAccountRole.ADMIN,
    WORKER: PrismaAccountRole.WORKER,
  }
}
