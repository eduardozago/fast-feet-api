import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { AccountRole } from '@/domain/identity/enterprise/entities/account'
import { CreateAccountUseCase } from '@/domain/identity/application/use-cases/create-account'
import { AccountAlreadyExistsError } from '@/domain/identity/application/use-cases/errors/account-already-exists-error'
import { EnvService } from '../env/env.service'

@Injectable()
export class BootstrapAdminService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BootstrapAdminService.name)

  constructor(
    private readonly createAccount: CreateAccountUseCase,
    private readonly env: EnvService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const email = this.env.get('BOOTSTRAP_ADMIN_EMAIL')
    const password = this.env.get('BOOTSTRAP_ADMIN_PASSWORD')

    if (!email && !password) return

    if (!email || !password) {
      this.logger.warn(
        'Bootstrap admin skipped — BOOTSTRAP_ADMIN_EMAIL and ' +
          'BOOTSTRAP_ADMIN_PASSWORD must both be set to create the initial admin.',
      )
      return
    }

    const result = await this.createAccount.execute({
      email,
      password,
      role: AccountRole.ADMIN,
    })

    if (result.isLeft()) {
      if (result.value instanceof AccountAlreadyExistsError) return

      this.logger.error('Bootstrap admin provisioning failed unexpectedly.')
      return
    }

    this.logger.log(`Bootstrap admin provisioned: ${email}`)
  }
}
