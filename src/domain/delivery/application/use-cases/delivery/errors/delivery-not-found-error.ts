import { UseCaseError } from '@/core/errors/use-case-error'

export class DeliveryNotFoundError extends Error implements UseCaseError {
  constructor() {
    super('Delivery not found.')
  }
}
