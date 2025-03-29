// search.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchMessageDto, SearchConversationDto } from './dto/search.dto';
import { MessageSearchResultDto, ConversationSearchResultDto } from './dto/search-result.dto';

// Mock search service
const mockSearchService = {
  searchMessages: jest.fn(),
  searchConversations: jest.fn(),
};

describe('SearchController', () => {
  let controller: SearchController;
  let service: SearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchMessages', () => {
    it('should call searchMessages method with correct parameters', async () => {
      const searchDto: SearchMessageDto = {
        query: 'test',
        limit: 10,
        offset: 0,
      };

      const expectedResult: MessageSearchResultDto[] = [
        {
          id: '1',
          content: 'Hello world',
          createdAt: new Date('2023-01-01'),
          relevance: 0.8,
        } as MessageSearchResultDto,
      ];

      jest.spyOn(service, 'searchMessages').mockResolvedValue(expectedResult);

      const result = await controller.searchMessages(searchDto);

      expect(service.searchMessages).toHaveBeenCalledWith(searchDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('searchConversations', () => {
    it('should call searchConversations method with correct parameters', async () => {
      const searchDto: SearchConversationDto = {
        query: 'test',
        limit: 10,
        offset: 0,
      };

      const expectedResult: ConversationSearchResultDto[] = [
        {
          id: 'conv1',
          title: 'Test Conversation',
          description: 'This is a test conversation',
          createdAt: new Date('2023-01-01'),
          relevance: 0.8,
        } as ConversationSearchResultDto,
      ];

      jest.spyOn(service, 'searchConversations').mockResolvedValue(expectedResult);

      const result = await controller.searchConversations(searchDto);

      expect(service.searchConversations).toHaveBeenCalledWith(searchDto);
      expect(result).toEqual(expectedResult);
    });
  });
});
