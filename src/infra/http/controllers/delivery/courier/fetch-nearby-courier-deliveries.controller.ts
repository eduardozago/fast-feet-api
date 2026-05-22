import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Query,
  Req,
} from '@nestjs/common'
import { FetchNearbyCourierDeliveriesUseCase } from '@/domain/delivery/application/use-cases/courier/fetch-nearby-courier-deliveries'
import { z } from 'zod'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CourierNotFoundError } from '@/domain/delivery/application/use-cases/courier/errors/courier-not-found-error'
import { CourierDeliveryDetailsPresenter } from '@/infra/http/presenters/courier-delivery-details-presenter'
import { Roles } from '@/infra/auth/roles.decorator'
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { CourierDeliveriesListResponse } from '../../../swagger/responses/courier-deliveries-list.response'

const fetchNearbyCourierDeliveriesQuerySchema = z.object({
  latitude: z.coerce
    .number({
      message: 'latitude must be a valid number.',
    })
    .min(-90, { message: 'latitude must be greater than or equal to -90.' })
    .max(90, { message: 'latitude must be less than or equal to 90.' }),
  longitude: z.coerce
    .number({
      message: 'longitude must be a valid number.',
    })
    .min(-180, { message: 'longitude must be greater than or equal to -180.' })
    .max(180, { message: 'longitude must be less than or equal to 180.' }),
  radiusInKm: z.coerce
    .number({
      message: 'radiusInKm must be a valid number.',
    })
    .positive({ message: 'radiusInKm must be greater than 0.' })
    .max(100, { message: 'radiusInKm must be less than or equal to 100.' }),
  page: z.coerce
    .number({
      message: 'page must be a valid number.',
    })
    .int({ message: 'page must be an integer.' })
    .positive({ message: 'page must be greater than 0.' })
    .default(1),
  limit: z.coerce
    .number({
      message: 'limit must be a valid number.',
    })
    .int({ message: 'limit must be an integer.' })
    .positive({ message: 'limit must be greater than 0.' })
    .max(100, { message: 'limit must be less than or equal to 100.' })
    .default(20),
})

type FetchNearbyCourierDeliveriesQuerySchema = z.infer<
  typeof fetchNearbyCourierDeliveriesQuerySchema
>

@ApiTags('Couriers')
@ApiBearerAuth('JWT')
@Controller()
export class FetchNearbyCourierDeliveriesController {
  constructor(
    private fetchNearbyCourierDeliveriesUseCase: FetchNearbyCourierDeliveriesUseCase,
  ) {}

  @Get('/couriers/me/deliveries/nearby')
  @Roles('WORKER')
  @ApiOperation({
    summary: 'List my nearby deliveries',
    description:
      "Returns paginated deliveries assigned to the authenticated courier whose recipient addresses fall within the specified radius of the courier's current position. Distance is calculated using the Haversine formula. Requires `WORKER` role.",
  })
  @ApiQuery({
    name: 'latitude',
    required: true,
    type: Number,
    description: "Courier's current latitude. Range: -90 to 90.",
    example: -23.5505,
  })
  @ApiQuery({
    name: 'longitude',
    required: true,
    type: Number,
    description: "Courier's current longitude. Range: -180 to 180.",
    example: -46.6333,
  })
  @ApiQuery({
    name: 'radiusInKm',
    required: true,
    type: Number,
    description: 'Search radius in kilometres. Maximum: 100 km.',
    example: 5,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-based). Defaults to 1.',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum results per page. Defaults to 20, max 100.',
    example: 20,
  })
  @ApiOkResponse({
    description: 'List of nearby deliveries for the authenticated courier.',
    type: CourierDeliveriesListResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @ApiForbiddenResponse({ description: 'Requires WORKER role.' })
  @ApiNotFoundResponse({
    description: 'No courier profile linked to the authenticated account.',
  })
  async handle(
    @Req() req: { user: UserPayload },
    @Query(new ZodValidationPipe(fetchNearbyCourierDeliveriesQuerySchema))
    query: FetchNearbyCourierDeliveriesQuerySchema,
  ) {
    const accountId = req.user.sub
    const { latitude, longitude, radiusInKm, page, limit } = query

    const result = await this.fetchNearbyCourierDeliveriesUseCase.execute({
      accountId,
      latitude,
      longitude,
      radiusInKm,
      page,
      limit,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case CourierNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    const deliveries = result.value.deliveries.map((delivery) =>
      CourierDeliveryDetailsPresenter.toHTTP(delivery),
    )

    return {
      deliveries,
    }
  }
}
