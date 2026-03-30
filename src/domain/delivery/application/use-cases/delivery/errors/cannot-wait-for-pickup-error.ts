import { UseCaseError } from '@/core/errors/use-case-error'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'

export class CannotWaitForPickupError extends Error implements UseCaseError {
  constructor(status: DeliveryStatus) {
    super(
      `Delivery cannot be set to waiting pickup from current status: ${status}`,
    )
  }
}
