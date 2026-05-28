import { AccountRole } from '../../enterprise/entities/value-objects/account-role'

export interface AccountInfo {
  id: string
  role: AccountRole
}

export abstract class IdentityGateway {
  abstract getAccount(accountId: string): Promise<AccountInfo | null>
}
