import { ApiProperty } from '@nestjs/swagger';

export class ValidateTokenResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User ID',
  })
  id: string;

  @ApiProperty({
    example: 'john@doe.com',
    description: 'User email',
  })
  email: string;

  @ApiProperty({
    example: 'johndoe',
    description: 'Username',
  })
  username: string;

  @ApiProperty({
    example: 'eXXXXXXxxxxxXXXXXXXXXXXXXX...',
    description: 'JWT access token',
  })
  accessToken: string;
}