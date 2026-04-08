import {
  BadRequestException,
  Controller,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common'
import { Roles } from '@/infra/auth/roles.decorator'
import { DeliveryNotFoundError } from '@/domain/delivery/application/use-cases/delivery/errors/delivery-not-found-error'
import { CompleteDeliveryUseCase } from '@/domain/delivery/application/use-cases/delivery/complete-delivery'
import { CannotCompleteDeliveryError } from '@/domain/delivery/application/use-cases/delivery/errors/cannot-complete-delivery-error'

@Controller()
export class CompleteDeliveryController {
  constructor(private completeDeliveryUseCase: CompleteDeliveryUseCase) {}

  @Patch('/deliveries/:id/complete')
  @Roles('ADMIN')
  @HttpCode(204)
  async handle(@Param('id') id: string) {
    const result = await this.completeDeliveryUseCase.execute({
      deliveryId: id,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case DeliveryNotFoundError:
          throw new NotFoundException(error.message)
        case CannotCompleteDeliveryError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
