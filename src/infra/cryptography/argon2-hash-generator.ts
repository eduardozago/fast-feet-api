import { HashGenerator } from '@/domain/identity/application/cryptography/hash-generator'
import * as argon2 from 'argon2'

export class Argon2HashGenerator implements HashGenerator {
  private options: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 47104,
    timeCost: 3,
    parallelism: 2,
  }

  async hash(plainText: string): Promise<string> {
    const passwordHashed = await argon2.hash(plainText, this.options)

    return passwordHashed
  }
}
