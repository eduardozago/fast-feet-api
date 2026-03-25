import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UsePipes,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../../../pipes/zod-validation-pipe'
import { Roles } from '@/infra/auth/roles.decorator'
import { CreateRecipientUseCase } from '@/domain/delivery/application/use-cases/recipient/create-recipient'
import { IdentificationType } from '@/domain/delivery/enterprise/entities/value-objects/identity-document'

const createRecipientBodySchema = z.object({
  name: z.string(),
  identityDocument: z.object({
    type: z.enum(Object.values(IdentificationType)),
    number: z.string(),
    issuingCountry: z.string(),
  }),
})

type CreateRecipientBodySchema = z.infer<typeof createRecipientBodySchema>

@Controller()
@UsePipes(new ZodValidationPipe(createRecipientBodySchema))
export class CreateRecipientController {
  constructor(private createRecipientUseCase: CreateRecipientUseCase) {}

  @Post('/recipients')
  @Roles('ADMIN')
  async handle(@Body() body: CreateRecipientBodySchema) {
    const { name, identityDocument } = body

    const result = await this.createRecipientUseCase.execute({
      name,
      identityDocument,
    })

    if (result.isLeft()) {
      throw new BadRequestException('Internal server error')
    }
  }
}
