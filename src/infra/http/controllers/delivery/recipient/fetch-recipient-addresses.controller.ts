import { BadRequestException, Controller, Get, Param } from '@nestjs/common'
import { Roles } from '@/infra/auth/roles.decorator'
import { FetchRecipientAddressesUseCase } from '@/domain/delivery/application/use-cases/recipient/fetch-recipient-addresses'
import { RecipientAddressPresenter } from '@/infra/http/presenters/recipient-address-presenter'

@Controller()
export class FetchRecipientAddressesController {
  constructor(
    private fetchRecipientAddressesUseCase: FetchRecipientAddressesUseCase,
  ) {}

  @Get('/recipients/:recipientId/addresses')
  @Roles('ADMIN')
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
