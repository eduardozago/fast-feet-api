import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common'
import { Roles } from '@/infra/auth/roles.decorator'
import { AssignCourierUseCase } from '@/domain/delivery/application/use-cases/delivery/assign-courier'
import { DeliveryNotFoundError } from '@/domain/delivery/application/use-cases/delivery/errors/delivery-not-found-error'
import { CannotAssignCourierError } from '@/domain/delivery/application/use-cases/delivery/errors/cannot-assign-courier-error'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import z from 'zod'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { AssignCourierDto } from '../../../swagger/dtos/delivery/assign-courier.dto'

const assignCourierBodySchema = z.object({
  courierId: z.string().uuid(),
})

type AssignCourierBodySchema = z.infer<typeof assignCourierBodySchema>

@ApiTags('Deliveries')
@ApiBearerAuth('JWT')
@Controller()
export class AssignCourierController {
  constructor(private assignCourierUseCase: AssignCourierUseCase) {}

  @Patch('/deliveries/:deliveryId/assign-courier')
  @Roles('ADMIN')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Assign a courier to a delivery',
    description:
      'Assign a courier to a delivery, transitioning its status from `CREATED` to `ASSIGNED`. The delivery becomes visible to the assigned courier. Can only be applied to deliveries in `CREATED` status. Requires `ADMIN` role.',
  })
  @ApiParam({
    name: 'deliveryId',
    format: 'uuid',
    description: 'ID of the delivery to assign a courier to.',
  })
  @ApiBody({ type: AssignCourierDto })
  @ApiNoContentResponse({
    description: 'Courier assigned. Delivery status is now ASSIGNED.',
  })
  @ApiBadRequestResponse({
    description: 'Delivery is not in CREATED status and cannot be assigned.',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role.' })
  @ApiNotFoundResponse({
    description: 'No delivery found with the provided deliveryId.',
  })
  async handle(
    @Param('deliveryId') deliveryId: string,
    @Body(new ZodValidationPipe(assignCourierBodySchema))
    body: AssignCourierBodySchema,
  ) {
    const { courierId } = body

    const result = await this.assignCourierUseCase.execute({
      deliveryId,
      courierId,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case DeliveryNotFoundError:
          throw new NotFoundException(error.message)
        case CannotAssignCourierError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
