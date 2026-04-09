import { Either } from '@/core/either'
import { GeocodingServiceError } from '../use-cases/errors/geocoding-service-error'

export interface GeocodingAddress {
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  country: string
  postalCode: string
}

export interface GeocodingResult {
  latitude: number
  longitude: number
}

export abstract class GeocodingService {
  abstract geocode(
    address: GeocodingAddress,
  ): Promise<Either<GeocodingServiceError, GeocodingResult>>
}
