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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { CreateRecipientDto } from '../../../swagger/dtos/recipient/create-recipient.dto'

const createRecipientBodySchema = z.object({
  name: z.string(),
  identityDocument: z.object({
    type: z.enum(Object.values(IdentificationType)),
    number: z.string(),
    issuingCountry: z.string(),
  }),
})

type CreateRecipientBodySchema = z.infer<typeof createRecipientBodySchema>

@ApiTags('Recipients')
@ApiBearerAuth('JWT')
@Controller()
@UsePipes(new ZodValidationPipe(createRecipientBodySchema))
export class CreateRecipientController {
  constructor(private createRecipientUseCase: CreateRecipientUseCase) {}

  @Post('/recipients')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Create a recipient',
    description:
      "Register a new recipient with a primary identity document. The identity document is used later during delivery completion to verify the receiver's identity. Requires `ADMIN` role.",
  })
  @ApiBody({ type: CreateRecipientDto })
  @ApiCreatedResponse({ description: 'Recipient created successfully.' })
  @ApiBadRequestResponse({
    description: 'Invalid request body or validation error.',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role.' })
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
