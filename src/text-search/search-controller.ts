// search.controller.ts
import { Controller, Get, Query, ValidationPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchMessageDto, SearchConversationDto } from './dto/search.dto';
import { MessageSearchResultDto, ConversationSearchResultDto } from './dto/search-result.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('messages')
  @ApiOperation({ summary: 'Search messages with full-text search' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns messages matching the search criteria',
    type: [MessageSearchResultDto]
  })
  async searchMessages(
    @Query(new ValidationPipe({ transform: true })) searchDto: SearchMessageDto,
  ): Promise<MessageSearchResultDto[]> {
    return this.searchService.searchMessages(searchDto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Search conversations with full-text search' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns conversations matching the search criteria',
    type: [ConversationSearchResultDto]
  })
  async searchConversations(
    @Query(new ValidationPipe({ transform: true })) searchDto: SearchConversationDto,
  ): Promise<ConversationSearchResultDto[]> {
    return this.searchService.searchConversations(searchDto);
  }
}
