import { PipeTransform, BadRequestException } from '@nestjs/common'
import { ZodError, ZodSchema } from 'zod'
import { fromZodError } from 'zod-validation-error'

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    try {
      const parsedValue = this.schema.parse(value)
      return parsedValue
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: 'Validation failed',
          statusCode: 400,
          errors: this.sanitizeErrors(error),
        })
      }
    }
  }

  private sanitizeErrors(error: ZodError) {
    const errors = fromZodError(error).details

    const formattedErrors = errors.map((error) => {
      return {
        ...(error.path.length > 0 && { field: error.path.join('.') }),
        message: error.message,
      }
    })

    return formattedErrors
  }
}
