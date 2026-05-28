import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Post,
  UsePipes,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../../../pipes/zod-validation-pipe'
import { Roles } from '@/infra/auth/roles.decorator'
import { RecipientNotFoundError } from '@/domain/delivery/application/use-cases/recipient/errors/recipient-not-found-error'
import { CreateDeliveryUseCase } from '@/domain/delivery/application/use-cases/delivery/create-delivery'
import { RecipientAddressNotFoundError } from '@/domain/delivery/application/use-cases/recipient/errors/recipient-address-not-found-error'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { CreateDeliveryDto } from '../../../swagger/dtos/delivery/create-delivery.dto'

const createDeliveryBodySchema = z.object({
  recipientId: z.string().uuid(),
  recipientAddressId: z.string().uuid(),
})

type CreateDeliveryBodySchema = z.infer<typeof createDeliveryBodySchema>

@ApiTags('Deliveries')
@ApiBearerAuth('JWT')
@Controller()
@UsePipes(new ZodValidationPipe(createDeliveryBodySchema))
export class CreateDeliveryController {
  constructor(private createDeliveryUseCase: CreateDeliveryUseCase) {}

  @Post('/deliveries')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Create a delivery',
    description:
      'Create a new delivery in `CREATED` status, linked to a recipient and one of their geocoded addresses. The delivery must be assigned to a courier before it enters the delivery lifecycle. Requires `ADMIN` role.',
  })
  @ApiBody({ type: CreateDeliveryDto })
  @ApiCreatedResponse({ description: 'Delivery created with status CREATED.' })
  @ApiBadRequestResponse({
    description: 'Invalid request body or validation error.',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role.' })
  @ApiNotFoundResponse({
    description: 'Recipient or recipient address not found.',
  })
  async handle(@Body() body: CreateDeliveryBodySchema) {
    const { recipientId, recipientAddressId } = body

    const result = await this.createDeliveryUseCase.execute({
      recipientId,
      recipientAddressId,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case RecipientNotFoundError:
          throw new NotFoundException(error.message)
        case RecipientAddressNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
