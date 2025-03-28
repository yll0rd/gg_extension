import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateConversationDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsNumber()
  userId: number;
}