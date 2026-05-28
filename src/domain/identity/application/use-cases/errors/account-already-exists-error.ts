import { UseCaseError } from '@/core/errors/use-case-error'

export class AccountAlreadyExistsError extends Error implements UseCaseError {
  constructor() {
    super('E-mail has already been used.')
  }
}
