// search.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchService } from './search.service';
import { Message } from '../messages/entities/message.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { SearchMessageDto, SearchConversationDto } from './dto/search.dto';

// Mock data
const mockMessages = [
  {
    id: '1',
    content: 'Hello world',
    createdAt: new Date('2023-01-01'),
    userId: 'user1',
    conversationId: 'conv1',
  },
  {
    id: '2',
    content: 'This is a test message',
    createdAt: new Date('2023-01-02'),
    userId: 'user2',
    conversationId: 'conv1',
  },
];

const mockConversations = [
  {
    id: 'conv1',
    title: 'Test Conversation',
    description: 'This is a test conversation',
    createdAt: new Date('2023-01-01'),
    participants: [{ id: 'user1' }, { id: 'user2' }],
  },
];

// Mock repository with queryBuilder
const createMockRepository = (mockData) => ({
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getRawAndEntities: jest.fn().mockResolvedValue({
      entities: mockData,
      raw: mockData.map((_, i) => ({ relevance: i === 0 ? '0.8' : '0.6' })),
    }),
  })),
});

describe('SearchService', () => {
  let service: SearchService;
  let messageRepository: Repository<Message>;
  let conversationRepository: Repository<Conversation>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: getRepositoryToken(Message),
          useValue: createMockRepository(mockMessages),
        },
        {
          provide: getRepositoryToken(Conversation),
          useValue: createMockRepository(mockConversations),
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    messageRepository = module.get<Repository<Message>>(getRepositoryToken(Message));
    conversationRepository = module.get<Repository<Conversation>>(getRepositoryToken(Conversation));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchMessages', () => {
    it('should return messages with relevance scores', async () => {
      const searchDto: SearchMessageDto = {
        query: 'test',
        limit: 10,
        offset: 0,
      };

      const result = await service.searchMessages(searchDto);

      expect(messageRepository.createQueryBuilder).toHaveBeenCalled();
      expect(result.length).toBe(mockMessages.length);
      expect(result[0].relevance).toBeDefined();
      expect(result[0].id).toBe(mockMessages[0].id);
    });

    it('should apply filters correctly', async () => {
      const searchDto: SearchMessageDto = {
        query: 'test',
        filters: {
          userId: 'user1',
          fromDate: new Date('2023-01-01'),
        },
        limit: 10,
        offset: 0,
      };

      await service.searchMessages(searchDto);

      const queryBuilder = messageRepository.createQueryBuilder();
      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(2);
    });

    it('should apply sorting correctly', async () => {
      const searchDto: SearchMessageDto = {
        query: 'test',
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        limit: 10,
        offset: 0,
      };

      await service.searchMessages(searchDto);

      const queryBuilder = messageRepository.createQueryBuilder();
      expect(queryBuilder.orderBy).toHaveBeenCalled();
    });
  });

  describe('searchConversations', () => {
    it('should return conversations with relevance scores', async () => {
      const searchDto: SearchConversationDto = {
        query: 'test',
        limit: 10,
        offset: 0,
      };

      const result = await service.searchConversations(searchDto);

      expect(conversationRepository.createQueryBuilder).toHaveBeenCalled();
      expect(result.length).toBe(mockConversations.length);
      expect(result[0].relevance).toBeDefined();
      expect(result[0].id).toBe(mockConversations[0].id);
    });

    it('should apply filters correctly', async () => {
      const searchDto: SearchConversationDto = {
        query: 'test',
        filters: {
          participantId: 'user1',
          fromDate: new Date('2023-01-01'),
        },
        limit: 10,
        offset: 0,
      };

      await service.searchConversations(searchDto);

      const queryBuilder = conversationRepository.createQueryBuilder();
      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(2);
    });
  });
});
