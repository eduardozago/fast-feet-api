export interface AccountInfo {
  id: string
}

export abstract class IdentityGateway {
  abstract findWorkerById(accountId: string): Promise<AccountInfo | null>
}
