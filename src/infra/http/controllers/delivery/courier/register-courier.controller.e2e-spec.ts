import { AppModule } from '@/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import * as argon2 from 'argon2'
import request from 'supertest'
import { AccountFactory } from 'test/factories/identity/make-account'
import { PrismaServiceE2E } from 'test/prisma-service-e2e'

describe('Register Courier (E2E)', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let accountFactory: AccountFactory
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory],
    })
      .overrideProvider(PrismaService)
      .useClass(PrismaServiceE2E)
      .compile()

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    )

    prisma = moduleRef.get(PrismaService)

    jwt = moduleRef.get(JwtService)

    accountFactory = moduleRef.get(AccountFactory)

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  test('[POST] /couriers', async () => {
    const account = await accountFactory.makePrismaAccount({
      email: 'johndoe@example.com',
      role: 'ADMIN',
      password: await argon2.hash('12345678'),
    })

    const accessToken = jwt.sign({
      sub: account.id.toString(),
      role: account.role,
    })

    const workerAccount = await accountFactory.makePrismaAccount({
      email: 'johndoe2@example.com',
      role: 'WORKER',
      password: await argon2.hash('12345678'),
    })

    const response = await request(app.getHttpServer())
      .post('/couriers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        accountId: workerAccount.id.toString(),
        name: 'John Doe',
      })

    expect(response.statusCode).toBe(201)

    const courierOnDatabase = await prisma.courier.findUnique({
      where: {
        accountId: workerAccount.id.toString(),
      },
    })

    if (!courierOnDatabase) {
      throw new Error('Courier not found')
    }

    expect(courierOnDatabase.accountId).toBe(workerAccount.id.toString())
    expect(courierOnDatabase.name).toBe('John Doe')
  })
})
