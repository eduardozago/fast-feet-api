import { UseCaseError } from '@/core/errors/use-case-error'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'

export class CannotStartTransitError extends Error implements UseCaseError {
  constructor(status: DeliveryStatus) {
    super(
      `Delivery cannot be started in transit from current status: ${status}`,
    )
  }
}
