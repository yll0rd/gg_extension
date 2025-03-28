/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { UsersService } from 'src/users/users.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import { MessageResponseDto } from '../dtos/messageResponse.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private readonly userService: UsersService,
  ) {}

  async createMessage(createMessageDto: CreateMessageDto): Promise<Message> {
    // Validate sender and conversation
    const sender = await this.userService.findOne(createMessageDto.senderId);
    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    const message = this.messageRepository.create({
      ...createMessageDto,
      senderId: sender.id,
    });

    return this.messageRepository.save(message);
  }

  async findMessagesByConversation(
    conversationId: string,
    page = 1,
    limit = 50,
  ): Promise<Message[]> {
    return this.messageRepository.find({
      where: { conversationId },
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['sender'],
    });
  }

  async findMessageById(messageId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['user'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  async updateMessage(
    id: string,
    updateMessageDto: UpdateMessageDto,
  ): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findOne({ where: { id } });
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    // Merge the existing message with the update DTO
    const updatedMessage = this.messageRepository.merge(
      message,
      updateMessageDto,
    );
    const savedMessage = await this.messageRepository.save(updatedMessage);

    return savedMessage;
  }

  async deleteMessage(messageId: string): Promise<void> {
    const result = await this.messageRepository.delete(messageId);

    if (result.affected === 0) {
      throw new NotFoundException('Message not found');
    }
  }
}
