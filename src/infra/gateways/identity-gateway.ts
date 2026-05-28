import {
  AccountInfo,
  IdentityGateway as IdentityGatewayInterface,
} from '@/domain/delivery/application/gateways/identity-gateway'
import { AccountsRepository } from '@/domain/identity/application/repositories/accounts-repository'
import { Injectable } from '@nestjs/common'

@Injectable()
export class IdentityGateway implements IdentityGatewayInterface {
  constructor(private accountsRepository: AccountsRepository) {}

  async getAccount(accountId: string): Promise<AccountInfo | null> {
    const account = await this.accountsRepository.findById(accountId)

    if (!account) {
      return null
    }

    return {
      id: account.id.toString(),
      role: account.role,
    }
  }
}
