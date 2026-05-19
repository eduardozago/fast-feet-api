import { UseCaseError } from '@/core/errors/use-case-error'

export class ProofOfDeliveryAlreadyExistsError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Proof of delivery already exists.')
  }
}
