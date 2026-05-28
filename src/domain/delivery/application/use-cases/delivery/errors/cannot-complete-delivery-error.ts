import { UseCaseError } from '@/core/errors/use-case-error'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'

export class CannotCompleteDeliveryError extends Error implements UseCaseError {
  constructor(status: DeliveryStatus) {
    super(`Delivery cannot be completed from current status: ${status}`)
  }
}
