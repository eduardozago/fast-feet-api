import { UseCaseError } from '@/core/errors/use-case-error'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'

export class CannotPickUpDeliveryError extends Error implements UseCaseError {
  constructor(status: DeliveryStatus) {
    super(`Delivery cannot be picked up from current status: ${status}`)
  }
}
