import { HashGenerator } from '@/domain/identity/application/cryptography/hash-generator'

export class FakeHashGenerator implements HashGenerator {
  hash(plainText: string): Promise<string> {
    return Promise.resolve(plainText.concat('-hashed'))
  }
}
