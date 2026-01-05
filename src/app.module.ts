import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './infra/database/database.module'

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
