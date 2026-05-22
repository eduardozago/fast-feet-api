import { ApiProperty } from '@nestjs/swagger'

export class AccessTokenResponse {
  @ApiProperty({
    example:
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1dWlkLWhlcmUiLCJyb2xlIjoiV09SS0VSIiwiaWF0IjoxNjE2MjM5MDIyfQ.signature',
    description:
      'RS256-signed JWT access token. Include it in subsequent requests as `Authorization: Bearer <token>`.',
  })
  access_token: string
}
