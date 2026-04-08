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

@Controller()
export class DeleteDeliveryController {
  constructor(private deleteDeliveryUseCase: DeleteDeliveryUseCase) {}

  @Delete('/deliveries/:id')
  @Roles('ADMIN')
  async handle(@Param('id') id: string) {
    const result = await this.deleteDeliveryUseCase.execute({
      deliveryId: id,
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
