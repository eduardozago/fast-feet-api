import { AppModule } from '@/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { PrismaServiceE2E } from 'test/prisma-service-e2e'

describe('Create account (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useClass(PrismaServiceE2E)
      .compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)

    await app.init()
  })

  test('[POST] /accounts', async () => {
    const response = await request(app.getHttpServer()).post('/accounts').send({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: '12345678',
    })

    expect(response.statusCode).toBe(201)

    const userOnDatabase = await prisma.account.findUnique({
      where: {
        email: 'johndoe@example.com',
      },
    })

    expect(userOnDatabase).toBeTruthy()
  })
})
