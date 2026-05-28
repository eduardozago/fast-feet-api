import { BadRequestException, Controller, Get, Query } from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { FetchDeliveriesUseCase } from '@/domain/delivery/application/use-cases/delivery/fetch-deliveries'
import { Roles } from '@/infra/auth/roles.decorator'
import { DeliveryDetailsPresenter } from '@/infra/http/presenters/delivery-details-presenter'
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { DeliveriesListResponse } from '../../../swagger/responses/deliveries-list.response'

const fetchDeliveriesQuerySchema = z.object({
  status: z.enum(['CREATED', 'ASSIGNED', 'IN_TRANSIT', 'COMPLETED']).optional(),
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

@ApiTags('Deliveries')
@ApiBearerAuth('JWT')
@Controller()
export class FetchDeliveriesController {
  constructor(private fetchDeliveriesUseCase: FetchDeliveriesUseCase) {}

  @Get('/deliveries')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'List deliveries',
    description:
      'Return a paginated list of all deliveries with enriched details — including recipient name and assigned courier name. Supports filtering by delivery status. Requires `ADMIN` role.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['CREATED', 'ASSIGNED', 'IN_TRANSIT', 'COMPLETED'],
    description: 'Filter deliveries by status. Omit to return all statuses.',
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
    description:
      'Paginated list of deliveries with recipient and courier details.',
    type: DeliveriesListResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role.' })
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
      DeliveryDetailsPresenter.toHTTP(delivery),
    )

    return {
      deliveries,
    }
  }
}
