import { UseCaseError } from '@/core/errors/use-case-error'

export class RecipientAddressNotFoundError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Recipient address not found.')
  }
}
