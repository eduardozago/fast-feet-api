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

const createDeliveryBodySchema = z.object({
  recipientId: z.string().uuid(),
  recipientAddressId: z.string().uuid(),
})

type CreateDeliveryBodySchema = z.infer<typeof createDeliveryBodySchema>

@Controller()
@UsePipes(new ZodValidationPipe(createDeliveryBodySchema))
export class CreateDeliveryController {
  constructor(private createDeliveryUseCase: CreateDeliveryUseCase) {}

  @Post('/deliveries')
  @Roles('ADMIN')
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
