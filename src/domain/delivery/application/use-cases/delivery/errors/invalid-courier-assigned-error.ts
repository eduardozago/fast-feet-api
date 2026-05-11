import { UseCaseError } from '@/core/errors/use-case-error'

export class InvalidCourierAssignedError extends Error implements UseCaseError {
  constructor(message = 'Invalid courier assigned to this delivery') {
    super(message)
  }
}
