import {
  BadRequestException,
  Controller,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Req,
} from '@nestjs/common'
import { Roles } from '@/infra/auth/roles.decorator'
import { DeliveryNotFoundError } from '@/domain/delivery/application/use-cases/delivery/errors/delivery-not-found-error'
import { PickUpDeliveryUseCase } from '@/domain/delivery/application/use-cases/delivery/pick-up-delivery'
import { CannotPickUpDeliveryError } from '@/domain/delivery/application/use-cases/delivery/errors/cannot-pick-up-error'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { InvalidCourierAssignedError } from '@/domain/delivery/application/use-cases/delivery/errors/invalid-courier-assigned-error'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

@ApiTags('Couriers')
@ApiBearerAuth('JWT')
@Controller()
export class PickUpDeliveryController {
  constructor(private pickUpDeliveryUseCase: PickUpDeliveryUseCase) {}

  @Patch('/couriers/me/deliveries/:deliveryId/pick-up')
  @Roles('WORKER')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Pick up a delivery',
    description:
      'Mark a delivery as picked up, transitioning its status from `ASSIGNED` to `IN_TRANSIT`. Only the courier that was assigned to the delivery can perform this action. Requires `WORKER` role.',
  })
  @ApiParam({
    name: 'deliveryId',
    format: 'uuid',
    description: 'ID of the delivery to pick up.',
  })
  @ApiNoContentResponse({
    description: 'Delivery picked up. Status is now IN_TRANSIT.',
  })
  @ApiBadRequestResponse({
    description:
      'Delivery is not in ASSIGNED status, or the authenticated courier is not the one assigned to it.',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @ApiForbiddenResponse({ description: 'Requires WORKER role.' })
  @ApiNotFoundResponse({
    description: 'No delivery found with the provided deliveryId.',
  })
  async handle(
    @Param('deliveryId') deliveryId: string,
    @Req() req: { user: UserPayload },
  ) {
    const accountId = req.user.sub

    const result = await this.pickUpDeliveryUseCase.execute({
      deliveryId,
      accountId,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case DeliveryNotFoundError:
          throw new NotFoundException(error.message)
        case CannotPickUpDeliveryError:
          throw new BadRequestException(error.message)
        case InvalidCourierAssignedError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
