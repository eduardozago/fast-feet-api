import { ApiProperty } from '@nestjs/swagger'
import { RecipientAddressResponse } from './recipient-address.response'

export class AddressesListResponse {
  @ApiProperty({ type: [RecipientAddressResponse] })
  addresses: RecipientAddressResponse[]
}
