import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common'
import { Roles } from '@/infra/auth/roles.decorator'
import { DeliveryNotFoundError } from '@/domain/delivery/application/use-cases/delivery/errors/delivery-not-found-error'
import { StartTransitUseCase } from '@/domain/delivery/application/use-cases/delivery/start-transit'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CannotStartTransitError } from '@/domain/delivery/application/use-cases/delivery/errors/cannot-start-transit-error'
import { CourierNotFoundError } from '@/domain/delivery/application/use-cases/courier/errors/courier-not-found-error'

const startTransitBodySchema = z.object({
  courierId: z.string().uuid(),
})

type StartTransitBodySchema = z.infer<typeof startTransitBodySchema>

@Controller()
export class StartTransitController {
  constructor(private startTransitUseCase: StartTransitUseCase) {}

  @Patch('/deliveries/:id/start-transit')
  @Roles('ADMIN')
  @HttpCode(204)
  async handle(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(startTransitBodySchema))
    body: StartTransitBodySchema,
  ) {
    const { courierId } = body

    const result = await this.startTransitUseCase.execute({
      deliveryId: id,
      courierId,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case DeliveryNotFoundError:
          throw new NotFoundException(error.message)
        case CourierNotFoundError:
          throw new NotFoundException(error.message)
        case CannotStartTransitError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
