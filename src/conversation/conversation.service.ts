import { Injectable, NotFoundException } from '@nestjs/common';
import { ConversationRepository } from './repositories/conversation.repository';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ConversationEntity } from './entities/conversation.entity';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@Injectable()
export class ConversationService {
  constructor(
    private readonly conversationRepository: ConversationRepository
  ) {}

  async create(createConversationDto: CreateConversationDto): Promise<ConversationEntity> {
    return this.conversationRepository.createConversation(createConversationDto);
  }

  async findAll(userId: number): Promise<ConversationEntity[]> {
    return this.conversationRepository.findAllByUserId(userId);
  }

  async findOne(id: number, userId: number): Promise<ConversationEntity> {
    const conversation = await this.conversationRepository.findOne({ 
      where: { id, userId } 
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return conversation;
  }

  async update(
    id: number, 
    userId: number, 
    updateConversationDto: UpdateConversationDto
  ): Promise<ConversationEntity> {
    const conversation = await this.findOne(id, userId);
    
    return this.conversationRepository.save({
      ...conversation,
      ...updateConversationDto
    });
  }

  async remove(id: number, userId: number): Promise<void> {
    const conversation = await this.findOne(id, userId);
    await this.conversationRepository.remove(conversation);
  }
}