import { UseCaseError } from '@/core/errors/use-case-error'

export class CourierNotFoundError extends Error implements UseCaseError {
  constructor() {
    super('Courier not found.')
  }
}
