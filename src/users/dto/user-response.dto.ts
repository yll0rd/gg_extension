import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 'johndoe',
    description: 'Username',
  })
  username: string;

  @ApiProperty({
    example: 'john@doe.com',
    description: 'Email address',
  })
  email: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Display name',
  })
  displayName?: string;

  @ApiPropertyOptional({
    example: 'https://doe.com/john.jpg',
    description: 'Avatar URL',
  })
  avatar?: string;

  @ApiPropertyOptional({
    example: 'I am the son of Doe',
    description: 'Short bio',
  })
  bio?: string;

  @ApiProperty({
    example: '2023-05-15T10:00:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2023-05-16T15:30:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;

  constructor(user: any) {
    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
    this.displayName = user.displayName;
    this.avatar = user.avatar;
    this.bio = user.bio;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
