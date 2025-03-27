import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: '00000000',
    description: 'New password (optional, min 8 characters)',
  })
  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'New display name (optional)',
  })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({
    example: 'https://doe.com/john.jpg',
    description: 'New avatar URL (optional)',
  })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({
    example: 'I am the son of Doe',
    description: 'Updated bio (optional)',
  })
  @IsString()
  @IsOptional()
  bio?: string;
}
