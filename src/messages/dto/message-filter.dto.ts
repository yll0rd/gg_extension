import { IsOptional, IsDate, IsEnum, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageType } from '../entities/message.entity';

export class MessageFilterDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @IsOptional()
  @IsString()
  searchQuery?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 50;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean; // New filter for read status
}
