import { Module } from '@nestjs/common'
import { HashGenerator } from '@/domain/identity/application/cryptography/hash-generator'
import { Argon2HashGenerator } from './argon2-hash-generator'
import { HashChecker } from '@/domain/identity/application/cryptography/hash-checker'
import { Argon2HashChecker } from './argon2-hash-checker'

@Module({
  providers: [
    {
      provide: HashGenerator,
      useClass: Argon2HashGenerator,
    },
    {
      provide: HashChecker,
      useClass: Argon2HashChecker,
    },
  ],
  exports: [HashGenerator, HashChecker],
})
export class CryptographyModule {}
