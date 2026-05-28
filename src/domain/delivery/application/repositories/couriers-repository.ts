import { Courier } from '../../enterprise/entities/courier'

export abstract class CouriersRepository {
  abstract findById(id: string): Promise<Courier | null>
  abstract findByAccountId(accountId: string): Promise<Courier | null>
  abstract create(courier: Courier): Promise<void>
}
