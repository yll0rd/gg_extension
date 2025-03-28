import { IsString, IsUUID, IsEnum, IsOptional, IsJSON } from 'class-validator';
import { MessageType } from '../entities/message.entity';

export class CreateMessageDto {
  @IsString()
  content: string;

  @IsUUID()
  senderId: string;

  @IsUUID()
  conversationId: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType = MessageType.TEXT;

  @IsOptional()
  @IsJSON()
  metadata?: Record<string, any>;
}
