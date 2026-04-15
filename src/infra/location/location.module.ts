import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { NominatimGeocodingService } from './nominatim-geocoding-service'
import { GeocodingService } from '@/domain/delivery/application/location/geocoding-service'
import { EnvModule } from '../env/env.module'

@Module({
  imports: [HttpModule, EnvModule],
  providers: [
    {
      provide: GeocodingService,
      useClass: NominatimGeocodingService,
    },
  ],
  exports: [GeocodingService],
})
export class LocationModule {}
