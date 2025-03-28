import { Injectable } from '@nestjs/common';
import { MessageResponseDto } from '../dtos/messageResponse.dto';
import { MessageRepository } from '../repository/message.repository';

@Injectable()
export class MessageService {
    constructor(
        private readonly messageRepository: MessageRepository
    ) {}

    async getUserConversations(userId: string): Promise<{ id: string }[]> {
        return await this.messageRepository.findUserConversations(userId);
      }
    
      async markAsRead(messageId: string, userId: string): Promise<MessageResponseDto | null> {
        return await this.messageRepository.markMessageAsRead(messageId, userId);
      }
    }
