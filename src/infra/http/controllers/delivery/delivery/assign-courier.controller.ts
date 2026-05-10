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
import { AssignCourierUseCase } from '@/domain/delivery/application/use-cases/delivery/assign-courier'
import { DeliveryNotFoundError } from '@/domain/delivery/application/use-cases/delivery/errors/delivery-not-found-error'
import { CannotAssignCourierError } from '@/domain/delivery/application/use-cases/delivery/errors/cannot-assign-courier-error'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import z from 'zod'

const assignCourierBodySchema = z.object({
  courierId: z.string().uuid(),
})

type AssignCourierBodySchema = z.infer<typeof assignCourierBodySchema>

@Controller()
export class AssignCourierController {
  constructor(private assignCourierUseCase: AssignCourierUseCase) {}

  @Patch('/deliveries/:deliveryId/assign-courier')
  @Roles('ADMIN')
  @HttpCode(204)
  async handle(
    @Param('deliveryId') deliveryId: string,
    @Body(new ZodValidationPipe(assignCourierBodySchema))
    body: AssignCourierBodySchema,
  ) {
    const { courierId } = body

    const result = await this.assignCourierUseCase.execute({
      deliveryId,
      courierId,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case DeliveryNotFoundError:
          throw new NotFoundException(error.message)
        case CannotAssignCourierError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
