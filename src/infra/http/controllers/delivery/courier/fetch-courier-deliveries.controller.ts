import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Query,
  Req,
} from '@nestjs/common'
import { FetchCourierDeliveriesUseCase } from '@/domain/delivery/application/use-cases/courier/fetch-courier-deliveries'
import { z } from 'zod'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CourierNotFoundError } from '@/domain/delivery/application/use-cases/courier/errors/courier-not-found-error'
import { CourierDeliveryDetailsPresenter } from '@/infra/http/presenters/courier-delivery-details-presenter'

const fetchCourierDeliveriesQuerySchema = z.object({
  status: z
    .enum(['CREATED', 'WAITING_PICKUP', 'IN_TRANSIT', 'COMPLETED'])
    .optional(),
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

type FetchCourierDeliveriesQuerySchema = z.infer<
  typeof fetchCourierDeliveriesQuerySchema
>

@Controller()
export class FetchCourierDeliveriesController {
  constructor(
    private fetchCourierDeliveriesUseCase: FetchCourierDeliveriesUseCase,
  ) {}

  @Get('/couriers/me/deliveries')
  async handle(
    @Req() req: { user: UserPayload },
    @Query(new ZodValidationPipe(fetchCourierDeliveriesQuerySchema))
    query: FetchCourierDeliveriesQuerySchema,
  ) {
    const accountId = req.user.sub
    const { status, page, limit } = query

    const result = await this.fetchCourierDeliveriesUseCase.execute({
      accountId,
      status,
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
