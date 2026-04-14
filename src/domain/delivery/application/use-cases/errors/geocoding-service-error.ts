import { UseCaseError } from '@/core/errors/use-case-error'

export class GeocodingServiceError extends Error implements UseCaseError {
  constructor(message: string) {
    super(message)
  }
}

export class GeocodingNetworkError extends GeocodingServiceError {
  constructor(message = 'Network error during geocoding') {
    super(message)
  }
}

export class GeocodingInvalidResponseError extends GeocodingServiceError {
  constructor() {
    super('Invalid response from geocoding service')
  }
}

export class GeocodingConfigurationError extends GeocodingServiceError {
  constructor() {
    super('Geocoding service misconfigured')
  }
}

export class GeocodingUnknownError extends GeocodingServiceError {
  constructor() {
    super('Geocoding service unknown error')
  }
}
