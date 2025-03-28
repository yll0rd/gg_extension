import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ConversationEntity } from '../entities/conversation.entity';
import { CreateConversationDto } from '../dto/create-conversation.dto';

@Injectable()
export class ConversationRepository extends Repository<ConversationEntity> {
  constructor(private dataSource: DataSource) {
    super(ConversationEntity, dataSource.createEntityManager());
  }

  async createConversation(createConversationDto: CreateConversationDto): Promise<ConversationEntity> {
    const conversation = this.create(createConversationDto);
    return this.save(conversation);
  }

  async findAllByUserId(userId: number): Promise<ConversationEntity[]> {
    return this.find({ 
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }
}