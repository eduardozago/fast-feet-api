import {
  BadRequestException,
  Body,
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
import { CannotCompleteDeliveryError } from '@/domain/delivery/application/use-cases/delivery/errors/cannot-complete-delivery-error'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import z from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'

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

@Controller()
export class CompleteDeliveryController {
  constructor(private completeDeliveryUseCase: CompleteDeliveryUseCase) {}

  @Patch('/couriers/me/deliveries/:deliveryId/complete')
  @Roles('WORKER')
  @HttpCode(204)
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
          throw new NotFoundException(error.message)
        case CannotCompleteDeliveryError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
