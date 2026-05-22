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
import {
  ApiBadGatewayResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { RecipientAddressDto } from '../../../swagger/dtos/recipient/recipient-address.dto'

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

@ApiTags('Recipients')
@ApiBearerAuth('JWT')
@Controller()
export class UpdateRecipientAddressController {
  constructor(
    private updateRecipientAddressUseCase: UpdateRecipientAddressUseCase,
  ) {}

  @Put('/recipients/:recipientId/addresses/:addressId')
  @Roles('ADMIN')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Update a recipient address',
    description:
      'Replace all fields of an existing recipient address. The address is re-geocoded on every update, refreshing the stored `latitude` and `longitude`. Requires `ADMIN` role.',
  })
  @ApiParam({
    name: 'recipientId',
    format: 'uuid',
    description: 'ID of the recipient that owns the address.',
  })
  @ApiParam({
    name: 'addressId',
    format: 'uuid',
    description: 'ID of the address to update.',
  })
  @ApiBody({ type: RecipientAddressDto })
  @ApiNoContentResponse({
    description: 'Address updated and re-geocoded successfully.',
  })
  @ApiNotFoundResponse({
    description:
      'No address found with the provided addressId for this recipient.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Geocoding service configuration error.',
  })
  @ApiBadGatewayResponse({
    description:
      'Geocoding service returned an invalid or unparseable response.',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role.' })
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
