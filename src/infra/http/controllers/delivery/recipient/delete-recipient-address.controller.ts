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

@ApiTags('Recipients')
@ApiBearerAuth('JWT')
@Controller()
export class DeleteRecipientAddressController {
  constructor(
    private deleteRecipientAddressUseCase: DeleteRecipientAddressUseCase,
  ) {}

  @Delete('/recipients/:recipientId/addresses/:addressId')
  @Roles('ADMIN')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete a recipient address',
    description:
      'Permanently remove a delivery address from a recipient. Requires `ADMIN` role.',
  })
  @ApiParam({
    name: 'recipientId',
    format: 'uuid',
    description: 'ID of the recipient that owns the address.',
  })
  @ApiParam({
    name: 'addressId',
    format: 'uuid',
    description: 'ID of the address to delete.',
  })
  @ApiNoContentResponse({ description: 'Address deleted successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid path parameters.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role.' })
  @ApiNotFoundResponse({
    description:
      'No address found with the provided addressId for this recipient.',
  })
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
