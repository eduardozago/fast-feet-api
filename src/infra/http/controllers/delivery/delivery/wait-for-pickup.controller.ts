import {
  BadRequestException,
  Controller,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common'
import { Roles } from '@/infra/auth/roles.decorator'
import { WaitForPickupUseCase } from '@/domain/delivery/application/use-cases/delivery/wait-for-pickup'
import { DeliveryNotFoundError } from '@/domain/delivery/application/use-cases/delivery/errors/delivery-not-found-error'
import { CannotWaitForPickupError } from '@/domain/delivery/application/use-cases/delivery/errors/cannot-wait-for-pickup-error'

@Controller()
export class WaitForPickupController {
  constructor(private waitForPickupUseCase: WaitForPickupUseCase) {}

  @Patch('/deliveries/:id/wait-for-pickup')
  @Roles('ADMIN')
  @HttpCode(204)
  async handle(@Param('id') id: string) {
    const result = await this.waitForPickupUseCase.execute({
      deliveryId: id,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case DeliveryNotFoundError:
          throw new NotFoundException(error.message)
        case CannotWaitForPickupError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
