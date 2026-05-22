import { BadRequestException, Controller, Get, Param } from '@nestjs/common'
import { Roles } from '@/infra/auth/roles.decorator'
import { FetchRecipientAddressesUseCase } from '@/domain/delivery/application/use-cases/recipient/fetch-recipient-addresses'
import { RecipientAddressPresenter } from '@/infra/http/presenters/recipient-address-presenter'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { AddressesListResponse } from '../../../swagger/responses/addresses-list.response'

@ApiTags('Recipients')
@ApiBearerAuth('JWT')
@Controller()
export class FetchRecipientAddressesController {
  constructor(
    private fetchRecipientAddressesUseCase: FetchRecipientAddressesUseCase,
  ) {}

  @Get('/recipients/:recipientId/addresses')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'List addresses for a recipient',
    description:
      'Return all delivery addresses registered for the specified recipient, including geocoded coordinates. Requires `ADMIN` role.',
  })
  @ApiParam({
    name: 'recipientId',
    format: 'uuid',
    description: 'ID of the recipient whose addresses to retrieve.',
  })
  @ApiOkResponse({
    description: 'List of addresses for the recipient.',
    type: AddressesListResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid recipientId.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role.' })
  async handle(@Param('recipientId') recipientId: string) {
    const result = await this.fetchRecipientAddressesUseCase.execute({
      recipientId,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    const { recipientAddresses } = result.value

    const addresses = recipientAddresses.map((address) =>
      RecipientAddressPresenter.toHTTP(address),
    )

    return {
      addresses,
    }
  }
}
