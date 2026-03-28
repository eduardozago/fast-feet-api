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
import { CreateRecipientAddressUseCase } from '@/domain/delivery/application/use-cases/recipient/create-recipient-address'
import { RecipientNotFoundError } from '@/domain/delivery/application/use-cases/recipient/errors/recipient-not-found-error'

const createRecipientAddressBodySchema = z.object({
  recipientId: z.string().uuid(),
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

@Controller()
@UsePipes(new ZodValidationPipe(createRecipientAddressBodySchema))
export class CreateRecipientAddressController {
  constructor(
    private createRecipientAddressUseCase: CreateRecipientAddressUseCase,
  ) {}

  @Post('/recipients/addresses')
  @Roles('ADMIN')
  async handle(@Body() body: CreateRecipientAddressBodySchema) {
    const {
      recipientId,
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

      switch (error.constructor) {
        case RecipientNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
