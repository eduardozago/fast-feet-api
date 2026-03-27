import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Put,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../../../pipes/zod-validation-pipe'
import { Roles } from '@/infra/auth/roles.decorator'
import { RecipientNotFoundError } from '@/domain/delivery/application/use-cases/recipient/errors/recipient-not-found-error'
import { UpdateRecipientAddressUseCase } from '@/domain/delivery/application/use-cases/recipient/update-recipient-address'

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

  @Put('/recipients/addresses/:addressId')
  @Roles('ADMIN')
  async handle(
    @Body(new ZodValidationPipe(updateRecipientAddressBodySchema))
    body: UpdateRecipientAddressBodySchema,
    @Param('addressId') addressId: string,
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

      switch (error.constructor) {
        case RecipientNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
