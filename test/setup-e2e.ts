import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client'
import { execSync } from 'node:child_process'

import { randomUUID } from 'node:crypto'

export const schemaId = randomUUID()

let prisma: PrismaClient

export function createTestAdapter() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined')
  }

  return new PrismaPg(
    {
      connectionString: process.env.DATABASE_URL,
    },
    {
      schema: schemaId,
    },
  )
}

beforeAll(async () => {
  const adapter = createTestAdapter()

  prisma = new PrismaClient({ adapter })

  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaId}"`)

  execSync('pnpm prisma db push', {
    env: {
      ...process.env,
      DATABASE_URL: `${process.env.DATABASE_URL}?schema=${schemaId}`,
    },
  })
}, 30000)

afterAll(async () => {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`)
  await prisma.$disconnect()
})
