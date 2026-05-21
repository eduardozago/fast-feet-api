import {
  BadGatewayException,
  Body,
  Controller,
  HttpCode,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Put,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../../../pipes/zod-validation-pipe'
import { Roles } from '@/infra/auth/roles.decorator'
import { UpdateRecipientAddressUseCase } from '@/domain/delivery/application/use-cases/recipient/update-recipient-address'
import { RecipientAddressNotFoundError } from '@/domain/delivery/application/use-cases/recipient/errors/recipient-address-not-found-error'
import {
  GeocodingConfigurationError,
  GeocodingInvalidResponseError,
} from '@/domain/delivery/application/use-cases/errors/geocoding-service-error'

const updateRecipientAddressBodySchema = z.object({
  street: z.string(),
  number: z.string(),
  neighborhood: z.string(),
  complement: z.string().optional(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  postalCode: z.string(),
})

type UpdateRecipientAddressBodySchema = z.infer<
  typeof updateRecipientAddressBodySchema
>

@Controller()
export class UpdateRecipientAddressController {
  constructor(
    private updateRecipientAddressUseCase: UpdateRecipientAddressUseCase,
  ) {}

  @Put('/recipients/:recipientId/addresses/:addressId')
  @Roles('ADMIN')
  @HttpCode(204)
  async handle(
    @Param('recipientId') recipientId: string,
    @Param('addressId') addressId: string,
    @Body(new ZodValidationPipe(updateRecipientAddressBodySchema))
    body: UpdateRecipientAddressBodySchema,
  ) {
    const {
      street,
      number,
      neighborhood,
      complement,
      city,
      state,
      country,
      postalCode,
    } = body

    const result = await this.updateRecipientAddressUseCase.execute({
      recipientId,
      recipientAddressId: addressId,
      street,
      number,
      neighborhood,
      complement,
      city,
      state,
      country,
      postalCode,
    })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof RecipientAddressNotFoundError) {
        throw new NotFoundException(error.message)
      }

      if (error instanceof GeocodingConfigurationError) {
        throw new InternalServerErrorException(error.message)
      }

      if (error instanceof GeocodingInvalidResponseError) {
        throw new BadGatewayException(error.message)
      }

      throw new InternalServerErrorException(error.message)
    }
  }
}
