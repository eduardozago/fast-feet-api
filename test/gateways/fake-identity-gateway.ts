import {
  AccountInfo,
  IdentityGateway as IdentityGatewayInterface,
} from '@/domain/delivery/application/gateways/identity-gateway'
import { AccountsRepository } from '@/domain/identity/application/repositories/accounts-repository'
import { AccountRole } from '@/domain/identity/enterprise/entities/account'

export class FakeIdentityGateway implements IdentityGatewayInterface {
  constructor(private accountsRepository: AccountsRepository) {}

  async findWorkerById(accountId: string): Promise<AccountInfo | null> {
    const account = await this.accountsRepository.findById(accountId)

    if (!account) {
      return null
    }

    const isWorker = account.role === AccountRole.WORKER

    if (!isWorker) {
      return null
    }

    return {
      id: account.id.toString(),
    }
  }
}
