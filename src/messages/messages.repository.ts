import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Message, MessageType } from './entities/message.entity';

@Injectable()
export class MessageRepository extends Repository<Message> {
  constructor(private dataSource: DataSource) {
    super(Message, dataSource.createEntityManager());
  }

  async createMessage(
    content: string,
    senderId: string,
    conversationId: string,
    type: MessageType = MessageType.TEXT,
    metadata?: Record<string, any>,
  ): Promise<Message> {
    const message = this.create({
      content,
      senderId,
      conversationId,
      type,
      metadata,
    });

    return this.save(message);
  }

  async findMessagesByConversation(
    conversationId: string,
    page = 1,
    limit = 50,
  ): Promise<Message[]> {
    return this.find({
      where: { conversationId },
      order: { timestamp: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
      relations: ['sender'], // Added to match services method
    });
  }

  async findMessageById(messageId: string): Promise<Message | null> {
    return this.findOne({
      where: { id: messageId },
      relations: ['sender'], // Added to match services method
    });
  }
}
