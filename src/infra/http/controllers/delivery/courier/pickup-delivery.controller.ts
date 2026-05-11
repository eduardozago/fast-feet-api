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

@Controller()
export class PickUpDeliveryController {
  constructor(private pickUpDeliveryUseCase: PickUpDeliveryUseCase) {}

  @Patch('/couriers/me/deliveries/:deliveryId/pick-up')
  @Roles('WORKER')
  @HttpCode(204)
  async handle(
    @Param('deliveryId') deliveryId: string,
    @Req() req: { user: UserPayload },
  ) {
    const courierId = req.user.sub

    const result = await this.pickUpDeliveryUseCase.execute({
      deliveryId,
      courierId,
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
