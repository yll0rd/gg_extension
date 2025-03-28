// src/messages/repositories/message.repository.ts
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
    limit = 50,
    offset = 0,
  ): Promise<Message[]> {
    return this.find({
      where: { conversationId },
      order: { timestamp: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}
