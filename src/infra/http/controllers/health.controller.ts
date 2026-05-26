import { Public } from '@/infra/auth/public'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common'

@Controller()
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get('/health')
  async health() {
    try {
      await this.prisma.$queryRaw`SELECT 1`

      return {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      }
    } catch {
      throw new HttpException(
        {
          status: 'error',
          error: 'Database connection failed',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }
  }
}
