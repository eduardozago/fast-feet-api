import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  NotFoundException,
  Param,
} from '@nestjs/common'
import { Roles } from '@/infra/auth/roles.decorator'
import { DeleteRecipientAddressUseCase } from '@/domain/delivery/application/use-cases/recipient/delete-recipient-address'
import { RecipientAddressNotFoundError } from '@/domain/delivery/application/use-cases/recipient/errors/recipient-address-not-found-error'

@Controller()
export class DeleteRecipientAddressController {
  constructor(
    private deleteRecipientAddressUseCase: DeleteRecipientAddressUseCase,
  ) {}

  @Delete('/recipients/:recipientId/addresses/:addressId')
  @Roles('ADMIN')
  @HttpCode(204)
  async handle(
    @Param('recipientId') recipientId: string,
    @Param('addressId') addressId: string,
  ) {
    const result = await this.deleteRecipientAddressUseCase.execute({
      recipientId,
      recipientAddressId: addressId,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case RecipientAddressNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
