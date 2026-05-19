import { UseCaseError } from '@/core/errors/use-case-error'

export class InvalidProofOfDeliveryError extends Error implements UseCaseError {
  constructor(message = 'Invalid proof of delivery.') {
    super(message)
  }
}
