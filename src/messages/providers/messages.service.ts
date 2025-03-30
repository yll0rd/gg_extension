import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, Like, In, Not } from 'typeorm';
import { Message } from '../entities/message.entity';
import { UsersService } from 'src/users/users.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import { MessageResponseDto } from '../dto/message-response.dto';
import { MessageFilterDto } from '../dto/message-filter.dto';
import { MarkReadDto } from '../dto/mark-read.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private readonly userService: UsersService,
  ) {}

  async createMessage(
    createMessageDto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    const sender = await this.userService.findOne(createMessageDto.senderId);
    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    const message = this.messageRepository.create({
      ...createMessageDto,
      senderId: sender.id,
      readByUsers: [],
    });

    const savedMessage = await this.messageRepository.save(message);
    return this.mapToResponseDto(savedMessage);
  }

  //The old method didn't make use of indexing at all
  async findMessages(
    conversationId: string,
    filterDto: MessageFilterDto,
  ): Promise<{ messages: MessageResponseDto[]; total: number }> {
    const {
      startDate,
      endDate,
      type,
      searchQuery,
      page = 1,
      limit = 50,
      isRead,
    } = filterDto;
    const queryBuilder = this.messageRepository.createQueryBuilder('message');

    queryBuilder.where('message.conversationId = :conversationId', {
      conversationId,
    });

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'message.timestamp BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    }

    if (type) {
      queryBuilder.andWhere('message.type = :type', { type });
    }

    if (searchQuery) {
      queryBuilder.andWhere('message.content ILIKE :searchQuery', {
        searchQuery: `%${searchQuery}%`,
      });
    }

    if (isRead !== undefined) {
      queryBuilder.andWhere(
        isRead
          ? 'array_length(message.readByUsers, 1) > 0'
          : 'array_length(message.readByUsers, 1) IS NULL',
      );
    }

    queryBuilder
      .orderBy('message.timestamp', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    const [messages, total] = await queryBuilder.getManyAndCount();

    return {
      messages: messages.map((msg) => this.mapToResponseDto(msg)),
      total,
    };
  }

  async findMessageById(messageId: string): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return this.mapToResponseDto(message);
  }

  async updateMessage(
    id: string,
    updateMessageDto: UpdateMessageDto,
  ): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findOne({ where: { id } });
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    const updatedMessage = this.messageRepository.merge(
      message,
      updateMessageDto,
    );
    const savedMessage = await this.messageRepository.save(updatedMessage);

    return this.mapToResponseDto(savedMessage);
  }

  async deleteMessage(messageId: string): Promise<void> {
    const result = await this.messageRepository.delete(messageId);

    if (result.affected === 0) {
      throw new NotFoundException('Message not found');
    }
  }

  //Unnecessary database hits fixed here
  async markMessageAsRead(
    markReadDto: MarkReadDto,
  ): Promise<MessageResponseDto> {
    const { messageId, userId } = markReadDto;

    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');

    if (!message.readByUsers.includes(userId)) {
      await this.messageRepository.update(messageId, {
        readByUsers: [...message.readByUsers, userId],
      });
    }

    return this.findMessageById(messageId);
  }

  private mapToResponseDto(message: Message): MessageResponseDto {
    return {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      conversationId: message.conversationId,
      type: message.type,
      timestamp: message.timestamp,
      metadata: message.metadata,
      readByUsers: message.readByUsers || [],
    };
  }
}
