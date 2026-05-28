import {
  GeocodingAddress,
  GeocodingResult,
  GeocodingService,
} from '@/domain/delivery/application/location/geocoding-service'
import { Either, left, right } from '@/core/either'
import { GeocodingServiceError } from '@/domain/delivery/application/use-cases/errors/geocoding-service-error'
import { faker } from '@faker-js/faker'

export class FakeGeocodingService implements GeocodingService {
  shouldFail = false

  geocode(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    address: GeocodingAddress,
  ): Promise<Either<GeocodingServiceError, GeocodingResult>> {
    if (this.shouldFail) {
      this.shouldFail = false
      return Promise.resolve(left(new GeocodingServiceError()))
    }

    return Promise.resolve(
      right({
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
      }),
    )
  }
}
