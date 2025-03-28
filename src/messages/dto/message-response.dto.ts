import { MessageType } from '../entities/message.entity';

export class MessageResponseDto {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  type: MessageType;
  timestamp: Date;
  metadata?: Record<string, any>;
}
