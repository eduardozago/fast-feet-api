import { UseCaseError } from '@/core/errors/use-case-error'

export class RecipientNotFoundError extends Error implements UseCaseError {
  constructor() {
    super('Recipient not found.')
  }
}
