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

@Controller()
export class FetchNearbyCourierDeliveriesController {
  constructor(
    private fetchNearbyCourierDeliveriesUseCase: FetchNearbyCourierDeliveriesUseCase,
  ) {}

  @Get('/couriers/me/deliveries/nearby')
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
