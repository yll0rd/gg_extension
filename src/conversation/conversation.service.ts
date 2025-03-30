import { Injectable, NotFoundException } from '@nestjs/common';
import { ConversationRepository } from './repositories/conversation.repository';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ConversationEntity } from './entities/conversation.entity';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private readonly conversationRepository: ConversationRepository,
  ) {}

  async create(
    createConversationDto: CreateConversationDto,
  ): Promise<ConversationEntity> {
    const start = Date.now(); // Start benchmarking
    this.logger.log('Creating conversation'); // Query logging

    const result = await this.conversationRepository.createConversation(
      createConversationDto,
    );

    const end = Date.now();
    this.logger.log(`Conversation created in ${end - start}ms`);

    return result;
  }

  async findAll(userId: number): Promise<ConversationEntity[]> {
    // return this.conversationRepository.findAllByUserId(userId);

    const start = Date.now(); // Start benchmarking
    this.logger.log(`Finding all conversations for user ${userId}`); // Query logging
    const result = await this.conversationRepository.findAllByUserId(userId);
    const end = Date.now();
    this.logger.log(`Found ${result.length} conversations in ${end - start}ms`);
    return result;
  }

  async findOne(id: number, userId: number): Promise<ConversationEntity> {
    const conversation = await this.conversationRepository.findOne({
      where: { id, userId },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return conversation;
  }

  async update(
    id: number,
    userId: number,
    updateConversationDto: UpdateConversationDto,
  ): Promise<ConversationEntity> {
    const start = Date.now(); // Start benchmarking
    this.logger.log(`Updating conversation ID ${id} for user ${userId}`); // Query logging
    const conversation = await this.findOne(id, userId);
    const result = await this.conversationRepository.save({
      ...conversation,
      ...updateConversationDto,
    });
    const end = Date.now();
    this.logger.log(`Conversation updated in ${end - start}ms`);
    return result;
  }

  async remove(id: number, userId: number): Promise<void> {
    const start = Date.now(); // Start benchmarking
    this.logger.log(`Deleting conversation ID ${id} for user ${userId}`); // Query logging
    const conversation = await this.findOne(id, userId);
    await this.conversationRepository.remove(conversation);
    const end = Date.now();
    this.logger.log(`Conversation deleted in ${end - start}ms`);
  }
}
