import {
  GeocodingAddress,
  GeocodingResult,
  GeocodingService,
} from '@/domain/delivery/application/location/geocoding-service'
import { Either, left, right } from '@/core/either'
import {
  GeocodingConfigurationError,
  GeocodingInvalidResponseError,
  GeocodingServiceError,
  GeocodingUnknownError,
} from '@/domain/delivery/application/use-cases/errors/geocoding-service-error'
import { HttpService } from '@nestjs/axios'
import { catchError, firstValueFrom, map, of, timeout } from 'rxjs'
import { Injectable, Logger } from '@nestjs/common'
import { EnvService } from '../env/env.service'
import { AxiosError } from 'axios'

interface NominatimGeocodingResponse {
  type: string
  features: Array<{
    geometry: {
      type: string
      coordinates: [number, number]
    }
  }>
}

@Injectable()
export class NominatimGeocodingService implements GeocodingService {
  private logger = new Logger(NominatimGeocodingService.name)
  private REQUEST_TIMEOUT = 10000

  constructor(
    private httpService: HttpService,
    private envService: EnvService,
  ) {}

  async geocode(
    address: GeocodingAddress,
  ): Promise<Either<GeocodingServiceError, GeocodingResult>> {
    const formattedAddress = this.formatAddress(address)

    const baseUrl = this.envService.get('NOMINATIM_API_URL')

    if (!baseUrl) {
      return left(new GeocodingConfigurationError())
    }

    const format = 'geojson'

    const userAgent =
      this.envService.get('NOMINATIM_API_USER_AGENT') ?? 'FastFeet/1.0'

    const response: Either<GeocodingServiceError, GeocodingResult> =
      await firstValueFrom(
        this.httpService
          .get<NominatimGeocodingResponse>(
            `${baseUrl}/search?q=${formattedAddress}&format=${format}`,
            {
              headers: {
                'User-Agent': userAgent,
                'Content-Type': 'application/json',
              },
              timeout: this.REQUEST_TIMEOUT,
            },
          )
          .pipe(
            timeout(this.REQUEST_TIMEOUT),
            map((response) => this.validateAndExtract(response.data, address)),
            catchError((error) => of(this.handleError(error, address))),
          ),
      )

    return response
  }

  private normalizeField(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, '+')
  }

  private formatAddress(address: GeocodingAddress): string {
    return [
      `${this.normalizeField(address.street)}+${this.normalizeField(address.number)}`,
      this.normalizeField(address.city),
      this.normalizeField(address.state),
      this.normalizeField(address.postalCode),
      this.normalizeField(address.country),
    ].join(',+')
  }

  private validateAndExtract(
    data: NominatimGeocodingResponse,
    address: GeocodingAddress,
  ): Either<GeocodingServiceError, GeocodingResult> {
    if (!data?.features || !Array.isArray(data.features)) {
      this.logger.warn(
        { response: data },
        'Invalid geocoding response structure',
      )
      return left(new GeocodingInvalidResponseError())
    }

    if (data.features.length === 0) {
      this.logger.debug({ address }, 'No geocoding results found')

      return left(new GeocodingInvalidResponseError())
    }

    const feature = data.features[0]

    if (
      !feature.geometry?.coordinates ||
      feature.geometry.coordinates.length !== 2
    ) {
      this.logger.warn({ feature }, 'Missing coordinates in geocoding response')

      return left(new GeocodingInvalidResponseError())
    }

    const [longitude, latitude] = feature.geometry.coordinates

    if (isNaN(latitude) || isNaN(longitude)) {
      return left(new GeocodingInvalidResponseError())
    }

    return right({ latitude, longitude })
  }

  private handleError(
    error: unknown,
    address: GeocodingAddress,
  ): Either<GeocodingServiceError, GeocodingResult> {
    if (error instanceof AxiosError) {
      const status = error.response?.status

      if (status && status >= 400 && status < 500) {
        this.logger.warn(
          { status, address: `${address.street}, ${address.city}` },
          'Geocoding client error',
        )
        return left(new GeocodingServiceError(`Client error: ${status}`))
      }

      if (status && status >= 500) {
        this.logger.error(
          { status, address: `${address.street}, ${address.city}` },
          'Geocoding server error',
        )
        return left(new GeocodingServiceError('Geocoding service unavailable'))
      }

      this.logger.error({ error }, 'Geocoding unknown error')
      return left(new GeocodingUnknownError())
    }

    this.logger.error({ error }, 'Unexpected geocoding error')
    return left(new GeocodingUnknownError())
  }
}
