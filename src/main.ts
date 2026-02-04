import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { EnvService } from './infra/env/env.service'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  )

  const configService = app.get(EnvService)
  const port = configService.get('PORT')

  await app.listen(port, '0.0.0.0')
}
void bootstrap()
