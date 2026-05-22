import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Req,
} from '@nestjs/common'
import { Roles } from '@/infra/auth/roles.decorator'
import { DeliveryNotFoundError } from '@/domain/delivery/application/use-cases/delivery/errors/delivery-not-found-error'
import { CompleteDeliveryUseCase } from '@/domain/delivery/application/use-cases/delivery/complete-delivery'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import z from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CourierNotFoundError } from '@/domain/delivery/application/use-cases/courier/errors/courier-not-found-error'
import { RecipientNotFoundError } from '@/domain/delivery/application/use-cases/recipient/errors/recipient-not-found-error'
import { RecipientAddressNotFoundError } from '@/domain/delivery/application/use-cases/recipient/errors/recipient-address-not-found-error'
import { ProofOfDeliveryAlreadyExistsError } from '@/domain/delivery/application/use-cases/delivery/errors/proof-of-delivery-already-exists-error'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { CompleteDeliveryDto } from '../../../swagger/dtos/courier/complete-delivery.dto'

const completeDeliveryBodySchema = z.object({
  receivedByName: z.string().trim().min(1),
  receivedByDocument: z.string().trim().min(1).optional(),
  recipientRelationship: z.enum([
    'RECIPIENT',
    'FAMILY_MEMBER',
    'DOORMAN',
    'RECEPTIONIST',
    'NEIGHBOR',
    'OTHER',
  ]),
  proofType: z.enum(['DOCUMENT', 'PHOTO', 'SIGNATURE', 'MANUAL']),
  proofImageUrl: z.string().trim().url().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().trim().min(1).optional(),
})

type CompleteDeliveryBodySchema = z.infer<typeof completeDeliveryBodySchema>

@ApiTags('Couriers')
@ApiBearerAuth('JWT')
@Controller()
export class CompleteDeliveryController {
  constructor(private completeDeliveryUseCase: CompleteDeliveryUseCase) {}

  @Patch('/couriers/me/deliveries/:deliveryId/complete')
  @Roles('WORKER')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Complete a delivery with proof',
    description: `Submit proof of delivery and transition the delivery from \`IN_TRANSIT\` to \`COMPLETED\`. This operation is atomic — the proof record and status update succeed or fail together.

**Evidence requirements:** At least one of \`receivedByDocument\` or \`proofImageUrl\` must be provided.

**Notes field:** Required when \`recipientRelationship\` is anything other than \`RECIPIENT\`.

**GPS coordinates:** Optional. When provided, the system calculates and stores the distance to the destination and classifies location validation as \`WITHIN_RANGE\` or \`OUT_OF_RANGE\`. When omitted, status is recorded as \`UNAVAILABLE\` — delivery is not blocked.

Only the courier assigned to the delivery can complete it. Requires \`WORKER\` role.`,
  })
  @ApiParam({
    name: 'deliveryId',
    format: 'uuid',
    description: 'ID of the delivery to complete.',
  })
  @ApiBody({ type: CompleteDeliveryDto })
  @ApiNoContentResponse({
    description:
      'Delivery completed. Proof of delivery recorded. Status is now COMPLETED.',
  })
  @ApiBadRequestResponse({
    description:
      'Delivery is not in IN_TRANSIT status, or evidence fields are missing.',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @ApiForbiddenResponse({ description: 'Requires WORKER role.' })
  @ApiNotFoundResponse({
    description:
      'Delivery, courier, recipient, or recipient address not found.',
  })
  @ApiConflictResponse({
    description: 'A proof of delivery already exists for this delivery.',
  })
  async handle(
    @Param('deliveryId') deliveryId: string,
    @Req() req: { user: UserPayload },
    @Body(new ZodValidationPipe(completeDeliveryBodySchema))
    body: CompleteDeliveryBodySchema,
  ) {
    const {
      receivedByName,
      receivedByDocument,
      recipientRelationship,
      proofType,
      proofImageUrl,
      latitude,
      longitude,
      notes,
    } = body

    const result = await this.completeDeliveryUseCase.execute({
      deliveryId,
      accountId: req.user.sub,
      receivedByName,
      receivedByDocument,
      recipientRelationship,
      proofType,
      proofImageUrl,
      latitude,
      longitude,
      notes,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case DeliveryNotFoundError:
        case CourierNotFoundError:
        case RecipientNotFoundError:
        case RecipientAddressNotFoundError:
          throw new NotFoundException(error.message)
        case ProofOfDeliveryAlreadyExistsError:
          throw new ConflictException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
