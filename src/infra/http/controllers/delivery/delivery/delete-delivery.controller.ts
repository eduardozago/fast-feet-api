import {
  BadRequestException,
  Controller,
  Delete,
  NotFoundException,
  Param,
} from '@nestjs/common'
import { Roles } from '@/infra/auth/roles.decorator'
import { DeliveryNotFoundError } from '@/domain/delivery/application/use-cases/delivery/errors/delivery-not-found-error'
import { DeleteDeliveryUseCase } from '@/domain/delivery/application/use-cases/delivery/delete-delivery'
import { CannotDeleteDeliveryError } from '@/domain/delivery/application/use-cases/delivery/errors/cannot-delete-delivery-error'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

@ApiTags('Deliveries')
@ApiBearerAuth('JWT')
@Controller()
export class DeleteDeliveryController {
  constructor(private deleteDeliveryUseCase: DeleteDeliveryUseCase) {}

  @Delete('/deliveries/:deliveryId')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Delete a delivery',
    description:
      'Permanently delete a delivery. Only deliveries with status `CREATED` (not yet assigned to a courier) can be deleted. Requires `ADMIN` role.',
  })
  @ApiParam({
    name: 'deliveryId',
    format: 'uuid',
    description: 'ID of the delivery to delete.',
  })
  @ApiOkResponse({ description: 'Delivery deleted successfully.' })
  @ApiBadRequestResponse({
    description:
      'Delivery cannot be deleted because its status is not CREATED.',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role.' })
  @ApiNotFoundResponse({
    description: 'No delivery found with the provided id.',
  })
  async handle(@Param('deliveryId') deliveryId: string) {
    const result = await this.deleteDeliveryUseCase.execute({
      deliveryId,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case DeliveryNotFoundError:
          throw new NotFoundException(error.message)
        case CannotDeleteDeliveryError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
