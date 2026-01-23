import { HashChecker } from '@/domain/identity/application/cryptography/hash-checker'
import * as argon2 from 'argon2'

export class Argon2HashChecker implements HashChecker {
  async check(password: string, hash: string): Promise<boolean> {
    const isValidPassword = await argon2.verify(hash, password)

    return isValidPassword
  }
}
