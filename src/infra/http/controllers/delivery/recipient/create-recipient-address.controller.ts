import {
  BadGatewayException,
  Body,
  Controller,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import z from 'zod'
import { ZodValidationPipe } from '../../../pipes/zod-validation-pipe'
import { Roles } from '@/infra/auth/roles.decorator'
import { CreateRecipientAddressUseCase } from '@/domain/delivery/application/use-cases/recipient/create-recipient-address'
import { RecipientNotFoundError } from '@/domain/delivery/application/use-cases/recipient/errors/recipient-not-found-error'
import {
  GeocodingConfigurationError,
  GeocodingInvalidResponseError,
} from '@/domain/delivery/application/use-cases/errors/geocoding-service-error'
import {
  ApiBadGatewayResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { RecipientAddressDto } from '../../../swagger/dtos/recipient/recipient-address.dto'

const createRecipientAddressBodySchema = z.object({
  street: z.string(),
  number: z.string(),
  neighborhood: z.string(),
  complement: z.string().optional(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  postalCode: z.string(),
})

type CreateRecipientAddressBodySchema = z.infer<
  typeof createRecipientAddressBodySchema
>

@ApiTags('Recipients')
@ApiBearerAuth('JWT')
@Controller()
@Throttle({ default: { ttl: 60000, limit: 20 } })
export class CreateRecipientAddressController {
  constructor(
    private createRecipientAddressUseCase: CreateRecipientAddressUseCase,
  ) {}

  @Post('/recipients/:recipientId/addresses')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Add an address to a recipient',
    description:
      'Create a new delivery address for the specified recipient. The address is automatically geocoded via Nominatim/OpenStreetMap on creation, storing `latitude` and `longitude` for proximity queries. Requires `ADMIN` role.',
  })
  @ApiParam({
    name: 'recipientId',
    format: 'uuid',
    description: 'ID of the recipient to add the address to.',
  })
  @ApiBody({ type: RecipientAddressDto })
  @ApiCreatedResponse({
    description: 'Address created and geocoded successfully.',
  })
  @ApiNotFoundResponse({
    description: 'No recipient found with the provided recipientId.',
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
  @ApiTooManyRequestsResponse({
    description:
      'Too many geocoding requests from this IP. Retry after 60 seconds.',
  })
  async handle(
    @Param('recipientId') recipientId: string,
    @Body(new ZodValidationPipe(createRecipientAddressBodySchema))
    body: CreateRecipientAddressBodySchema,
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

    const result = await this.createRecipientAddressUseCase.execute({
      recipientId,
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

      if (error instanceof RecipientNotFoundError) {
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
