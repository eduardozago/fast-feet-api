import { HashChecker } from '@/domain/identity/application/cryptography/hash-checker'

export class FakeHashChecker implements HashChecker {
  check(password: string, hash: string): Promise<boolean> {
    return Promise.resolve(password.concat('-hashed') === hash)
  }
}
