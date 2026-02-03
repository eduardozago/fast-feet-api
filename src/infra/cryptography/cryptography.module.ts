import { Module } from '@nestjs/common'
import { HashGenerator } from '@/domain/identity/application/cryptography/hash-generator'
import { Argon2HashGenerator } from './argon2-hash-generator'
import { HashChecker } from '@/domain/identity/application/cryptography/hash-checker'
import { Argon2HashChecker } from './argon2-hash-checker'
import { Encrypter } from '@/domain/identity/application/cryptography/encrypter'
import { JwtEncrypter } from './jwt-encrypter'

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
    {
      provide: Encrypter,
      useClass: JwtEncrypter,
    },
  ],
  exports: [HashGenerator, HashChecker, Encrypter],
})
export class CryptographyModule {}
