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

    const where: FindOptionsWhere<Message> = { conversationId };

    if (startDate && endDate) {
      where.timestamp = Between(startDate, endDate);
    }

    if (type) {
      where.type = type;
    }

    if (searchQuery) {
      where.content = Like(`%${searchQuery}%`);
    }

    if (isRead !== undefined) {
      where.readByUsers = isRead ? Not([]) : In([[]]);
    }

    const [messages, total] = await this.messageRepository.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      messages: messages.map((message) => this.mapToResponseDto(message)),
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

    const updatedMessage = this.messageRepository.merge(message, updateMessageDto);
    const savedMessage = await this.messageRepository.save(updatedMessage);

    return this.mapToResponseDto(savedMessage);
  }

  async deleteMessage(messageId: string): Promise<void> {
    const result = await this.messageRepository.delete(messageId);

    if (result.affected === 0) {
      throw new NotFoundException('Message not found');
    }
  }

  async markMessageAsRead(markReadDto: MarkReadDto): Promise<MessageResponseDto> {
    const { messageId, userId } = markReadDto;

    const message = await this.messageRepository.findOne({ where: { id: messageId } });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (!message.readByUsers) {
      message.readByUsers = [];
    }

    if (!message.readByUsers.includes(userId)) {
      message.readByUsers.push(userId);
      await this.messageRepository.save(message);
    }

    return this.mapToResponseDto(message);
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
