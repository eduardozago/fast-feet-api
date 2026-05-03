import { BadRequestException, Controller, Get, Query } from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { DeliveryPresenter } from '@/infra/http/presenters/delivery-presenter'
import { FetchDeliveriesUseCase } from '@/domain/delivery/application/use-cases/delivery/fetch-deliveries'
import { Roles } from '@/infra/auth/roles.decorator'

const fetchDeliveriesQuerySchema = z.object({
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

type FetchDeliveriesQuerySchema = z.infer<typeof fetchDeliveriesQuerySchema>

@Controller()
export class FetchDeliveriesController {
  constructor(private fetchDeliveriesUseCase: FetchDeliveriesUseCase) {}

  @Get('/deliveries')
  @Roles('ADMIN')
  async handle(
    @Query(new ZodValidationPipe(fetchDeliveriesQuerySchema))
    query: FetchDeliveriesQuerySchema,
  ) {
    const { status, page, limit } = query

    const result = await this.fetchDeliveriesUseCase.execute({
      status,
      page,
      limit,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    const deliveries = result.value.deliveries.map((delivery) =>
      DeliveryPresenter.toHTTP(delivery),
    )

    return {
      deliveries,
    }
  }
}
