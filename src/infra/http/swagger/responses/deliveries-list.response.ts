import { ApiProperty } from '@nestjs/swagger'
import { DeliveryDetailsResponse } from './delivery-details.response'

export class DeliveriesListResponse {
  @ApiProperty({ type: [DeliveryDetailsResponse] })
  deliveries: DeliveryDetailsResponse[]
}
