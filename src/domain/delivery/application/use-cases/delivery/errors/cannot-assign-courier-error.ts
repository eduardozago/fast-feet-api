import { UseCaseError } from '@/core/errors/use-case-error'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'

export class CannotAssignCourierError extends Error implements UseCaseError {
  constructor(status: DeliveryStatus) {
    super(
      `Delivery cannot be assigned to courier from current status: ${status}`,
    )
  }
}
