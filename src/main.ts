import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { EnvService } from './infra/env/env.service'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  )

  const configService = app.get(EnvService)
  const port = configService.get('PORT')

  const config = new DocumentBuilder()
    .setTitle('Fast Feet API')
    .setDescription(
      `REST API for managing the full lifecycle of package deliveries — from account creation and courier registration through recipient address geocoding to real-time nearby delivery queries based on geolocation.

## Authentication

Most endpoints require a Bearer JWT token. Authenticate via **POST /sessions** to obtain a token, then click **Authorize** and enter it as \`Bearer <token>\`.

## Roles

| Role | Description |
|------|-------------|
| \`ADMIN\` | Manages couriers, recipients, addresses, deliveries, and courier assignments |
| \`WORKER\` | Courier role — can view and act on their own assigned deliveries |

## Delivery Lifecycle

\`\`\`
CREATED → ASSIGNED → IN_TRANSIT → COMPLETED
\`\`\`

1. **CREATED** — Admin creates the delivery linked to a recipient address
2. **ASSIGNED** — Admin assigns a courier (delivery becomes visible to the courier)
3. **IN_TRANSIT** — Assigned courier picks up the package
4. **COMPLETED** — Assigned courier submits proof of delivery`,
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'RS256-signed JWT. Obtain a token from **POST /sessions** and enter it here as `Bearer <token>`.',
      },
      'JWT',
    )
    .addTag(
      'Identity',
      'Account registration, authentication, and password management',
    )
    .addTag(
      'Couriers',
      'Courier registration and courier-facing delivery operations',
    )
    .addTag('Recipients', 'Recipient management and address geocoding')
    .addTag(
      'Deliveries',
      'Delivery creation, listing, assignment, and admin operations',
    )
    .build()

  const documentFactory = () => SwaggerModule.createDocument(app, config)

  SwaggerModule.setup('docs', app, documentFactory, {
    jsonDocumentUrl: 'docs/json',
    yamlDocumentUrl: 'docs/yaml',
    swaggerUiEnabled: false,
  })

  app.use(
    '/reference',
    apiReference({
      url: '/docs/json',
      theme: 'deepSpace',
      pageTitle: 'Fast Feet API — Documentation',
      withFastify: true,
    }),
  )

  await app.listen(port, '0.0.0.0')
}
void bootstrap()
