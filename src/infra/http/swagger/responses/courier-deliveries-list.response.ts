import { ApiProperty } from '@nestjs/swagger'
import { CourierDeliveryDetailsResponse } from './courier-delivery-details.response'

export class CourierDeliveriesListResponse {
  @ApiProperty({ type: [CourierDeliveryDetailsResponse] })
  deliveries: CourierDeliveryDetailsResponse[]
}
