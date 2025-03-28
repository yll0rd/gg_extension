/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageType } from '../entities/message.entity';
import { UsersService } from 'src/users/users.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { NotFoundException } from '@nestjs/common';

describe('MessagesService', () => {
  let service: MessagesService;
  let mockMessageRepository: Partial<
    Record<keyof Repository<Message>, jest.Mock>
  >;
  let mockUsersService: Partial<UsersService>;

  beforeEach(async () => {
    mockMessageRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      delete: jest.fn(),
      merge: jest.fn(),
    };

    mockUsersService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getRepositoryToken(Message),
          useValue: mockMessageRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  describe('createMessage', () => {
    it('should create a message successfully', async () => {
      const createMessageDto: CreateMessageDto = {
        content: 'Test message',
        type: MessageType.TEXT,
        senderId: 'sender-uuid',
        conversationId: 'conversation-uuid',
      };

      const mockUser = { id: 'sender-uuid' };
      const mockMessage = {
        ...createMessageDto,
        id: 'message-uuid',
        timestamp: new Date(),
      };

      mockUsersService.findOne = jest.fn().mockResolvedValue(mockUser);
      mockMessageRepository.create = jest.fn().mockReturnValue(mockMessage);
      mockMessageRepository.save = jest.fn().mockResolvedValue(mockMessage);

      const result = await service.createMessage(createMessageDto);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(
        createMessageDto.senderId,
      );
      expect(mockMessageRepository.create).toHaveBeenCalledWith({
        ...createMessageDto,
        senderId: mockUser.id,
      });
      expect(mockMessageRepository.save).toHaveBeenCalledWith(mockMessage);
      expect(result).toEqual(
        expect.objectContaining({
          content: 'Test message',
          type: MessageType.TEXT,
        }),
      );
    });

    it('should throw NotFoundException if sender does not exist', async () => {
      const createMessageDto: CreateMessageDto = {
        content: 'Test message',
        type: MessageType.TEXT,
        senderId: 'sender-uuid',
        conversationId: 'conversation-uuid',
      };

      mockUsersService.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.createMessage(createMessageDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findMessages', () => {
    it('should retrieve messages with filters', async () => {
      const conversationId = 'conversation-uuid';
      const filterDto = {
        page: 1,
        limit: 50,
        type: MessageType.TEXT,
      };

      const mockMessages = [
        {
          id: 'message-1',
          content: 'Test message 1',
          type: MessageType.TEXT,
          conversationId,
        },
        {
          id: 'message-2',
          content: 'Test message 2',
          type: MessageType.TEXT,
          conversationId,
        },
      ];

      mockMessageRepository.findAndCount = jest
        .fn()
        .mockResolvedValue([mockMessages, 2]);

      const result = await service.findMessages(conversationId, filterDto);

      expect(result.messages).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockMessageRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            conversationId,
            type: MessageType.TEXT,
          }),
        }),
      );
    });
  });
});
