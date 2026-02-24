import { UseCaseError } from '@/core/errors/use-case-error'

export class AccountNotFoundError extends Error implements UseCaseError {
  constructor() {
    super('Account not found.')
  }
}
