import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @ApiProperty({ example: 'john@doe.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '00000000' })
  @IsString()
  @MinLength(8)
  password: string;
}
