import { UseCaseError } from '@/core/errors/use-case-error'

export class GeocodingServiceError extends Error implements UseCaseError {
  constructor() {
    super('Could not geocode the provided address.')
  }
}
